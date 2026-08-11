'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Boxes,
    Plus,
    CheckCircle2,
    Lock,
    Unlock,
    Trash2,
    Printer,
    FileSpreadsheet,
    Grid,
    ListFilter,
    Layers,
    Save,
    XCircle,
    AlertCircle,
    ChevronRight,
    Edit3
} from 'lucide-react';
import {
    createCountArticle,
    deleteCountArticle,
    createNewCountSession,
    saveArticleMatrixCounts,
    completeCountSession
} from '@/app/actions/articleCounting';

interface Article {
    id: string;
    name: string;
    code?: string | null;
    colors: string[];
    sizes: string[];
}

interface CountSessionItem {
    id: string;
    sessionId: string;
    articleId: string;
    color: string;
    size: string;
    quantity: number;
    article?: Article;
}

interface CountSession {
    id: string;
    name: string;
    status: string;
    notes?: string | null;
    createdAt: string;
    items: CountSessionItem[];
}

interface ColorSizeCountingMatrixProps {
    mode: 'manager' | 'admin';
    articles: Article[];
    session: CountSession;
}

export default function ColorSizeCountingMatrix({
    mode,
    articles = [],
    session
}: ColorSizeCountingMatrixProps) {
    const [activeTab, setActiveTab] = useState<'matrix' | 'plan'>('matrix');
    const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
    const [matrixInputs, setMatrixInputs] = useState<{ [colorSizeKey: string]: number }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modals
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [articleName, setArticleName] = useState('');
    const [articleCode, setArticleCode] = useState('');
    const [articleColors, setArticleColors] = useState<string[]>(['Black', 'White', 'Navy']);
    const [articleSizes, setArticleSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);

    const [showSessionModal, setShowSessionModal] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    const activeArticle = useMemo(() => {
        return articles.find(a => a.id === selectedArticleId) || articles[0];
    }, [articles, selectedArticleId]);

    // Load existing counts into matrixInputs when activeArticle or session items change
    useEffect(() => {
        if (!activeArticle || !session?.items) return;

        const initialMap: { [key: string]: number } = {};
        session.items
            .filter(item => item.articleId === activeArticle.id)
            .forEach(item => {
                const key = `${item.color}___${item.size}`;
                initialMap[key] = item.quantity;
            });

        setMatrixInputs(initialMap);
    }, [activeArticle, session]);

    // Calculate Row, Column & Grand Totals for active Article
    const matrixCalculations = useMemo(() => {
        if (!activeArticle) return { rowTotals: {}, colTotals: {}, grandTotal: 0 };

        const rowTotals: { [color: string]: number } = {};
        const colTotals: { [size: string]: number } = {};
        let grandTotal = 0;

        activeArticle.colors.forEach(color => {
            rowTotals[color] = 0;
            activeArticle.sizes.forEach(size => {
                const qty = matrixInputs[`${color}___${size}`] || 0;
                rowTotals[color] += qty;
                colTotals[size] = (colTotals[size] || 0) + qty;
                grandTotal += qty;
            });
        });

        return { rowTotals, colTotals, grandTotal };
    }, [activeArticle, matrixInputs]);

    // Save Matrix Counts for Active Article
    const handleSaveMatrix = async () => {
        if (!activeArticle || !session) return;

        setIsSaving(true);
        const payloadCounts: { color: string; size: string; quantity: number }[] = [];

        activeArticle.colors.forEach(color => {
            activeArticle.sizes.forEach(size => {
                const qty = matrixInputs[`${color}___${size}`] || 0;
                payloadCounts.push({ color, size, quantity: qty });
            });
        });

        const res = await saveArticleMatrixCounts({
            sessionId: session.id,
            articleId: activeArticle.id,
            counts: payloadCounts
        });

        if (res.success) {
            setMessage({ type: 'success', text: `Saved counts for "${activeArticle.name}". Total: ${matrixCalculations.grandTotal} pcs.` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to save matrix counts.' });
        }
        setIsSaving(false);
    };

    // Add New Article Definition
    const handleCreateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!articleName.trim()) return;

        const res = await createCountArticle({
            name: articleName.trim(),
            code: articleCode.trim() || undefined,
            colors: articleColors.filter(c => c.trim().length > 0),
            sizes: articleSizes.filter(s => s.trim().length > 0)
        });

        if (res.success && res.article) {
            setMessage({ type: 'success', text: `Created article "${res.article.name}".` });
            setSelectedArticleId(res.article.id);
            setArticleName('');
            setArticleCode('');
            setShowArticleModal(false);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to create article.' });
        }
    };

    // Delete Article Definition
    const handleDeleteArticle = async (id: string, name: string) => {
        if (!confirm(`Delete article "${name}" and all associated counts?`)) return;
        const res = await deleteCountArticle(id);
        if (res.success) {
            setMessage({ type: 'success', text: `Article "${name}" deleted.` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to delete article.' });
        }
    };

    // Create New Session
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createNewCountSession(newSessionName.trim());
        if (res.success) {
            setMessage({ type: 'success', text: 'New inventory counting session started.' });
            setShowSessionModal(false);
            setNewSessionName('');
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to create session.' });
        }
    };

    // Complete Session
    const handleCompleteSession = async () => {
        if (!confirm('Finalize and lock this counting session?')) return;
        const res = await completeCountSession(session.id);
        if (res.success) {
            setMessage({ type: 'success', text: 'Counting session finalized and locked.' });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to finalize session.' });
        }
    };

    // Compute Session Plan Summary
    const sessionPlanSummary = useMemo(() => {
        if (!session?.items) return [];

        const articleMap: { [articleId: string]: { article: Article; items: CountSessionItem[]; totalPieces: number } } = {};

        articles.forEach(art => {
            articleMap[art.id] = { article: art, items: [], totalPieces: 0 };
        });

        session.items.forEach(item => {
            if (articleMap[item.articleId]) {
                articleMap[item.articleId].items.push(item);
                articleMap[item.articleId].totalPieces += item.quantity;
            }
        });

        return Object.values(articleMap);
    }, [articles, session]);

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto p-4 md:p-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                        <Grid size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">{session?.name || 'Inventory Counting Session'}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                session?.status === 'OPEN'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                                {session?.status === 'OPEN' ? '🟢 OPEN SESSION' : '🔒 COMPLETED'}
                            </span>
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold uppercase">
                                {mode === 'admin' ? 'Admin Authority' : 'Manager Terminal'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">
                            Standalone Color × Size Article Inventory Counting & Plan Generator
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowArticleModal(true)}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={16} /> Define Article (Color/Size)
                    </button>
                    <button
                        onClick={() => setShowSessionModal(true)}
                        className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Layers size={16} /> New Session
                    </button>
                    {session?.status === 'OPEN' && (
                        <button
                            onClick={handleCompleteSession}
                            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                        >
                            <CheckCircle2 size={16} /> Finalize Session
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Alert */}
            {message && (
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === 'matrix'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <Grid size={16} /> Color × Size Matrix Counter
                </button>
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === 'plan'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <FileSpreadsheet size={16} /> Counted List Plan ({sessionPlanSummary.reduce((sum, a) => sum + a.totalPieces, 0)} pcs)
                </button>
            </div>

            {/* TAB 1: COLOR × SIZE MATRIX COUNTER */}
            {activeTab === 'matrix' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column: Article Selector List */}
                    <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Defined Articles ({articles.length})</h3>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {articles.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs italic">
                                    No articles defined yet. Click "+ Define Article" to get started.
                                </div>
                            ) : (
                                articles.map(art => {
                                    const isSelected = art.id === activeArticle?.id;
                                    const countedItemCount = session?.items?.filter(i => i.articleId === art.id).reduce((sum, i) => sum + i.quantity, 0) || 0;

                                    return (
                                        <div
                                            key={art.id}
                                            onClick={() => setSelectedArticleId(art.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                                                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-900 text-xs truncate">{art.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{art.code || 'NO-SKU'} • {art.colors.length} Colors • {art.sizes.length} Sizes</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${countedItemCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                                    {countedItemCount} pcs
                                                </span>
                                                {mode === 'admin' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteArticle(art.id, art.name);
                                                        }}
                                                        className="block text-slate-300 hover:text-rose-600 mt-1 ml-auto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Color x Size Matrix Grid */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        {!activeArticle ? (
                            <div className="text-center py-20 text-slate-400 text-sm">
                                Please select or create an article to start matrix piece counting.
                            </div>
                        ) : (
                            <>
                                {/* Article Header Info */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            {activeArticle.name}
                                            {activeArticle.code && (
                                                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                                                    {activeArticle.code}
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium mt-1">
                                            Colors: <span className="text-slate-700 font-bold">{activeArticle.colors.join(', ')}</span> |
                                            Sizes: <span className="text-slate-700 font-bold">{activeArticle.sizes.join(', ')}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Article Total</span>
                                            <span className="text-xl font-black text-indigo-900 font-mono">{matrixCalculations.grandTotal} pcs</span>
                                        </div>

                                        {session?.status === 'OPEN' && (
                                            <button
                                                onClick={handleSaveMatrix}
                                                disabled={isSaving}
                                                className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
                                            >
                                                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Matrix Counts'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Matrix Table Grid */}
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold">
                                            <tr>
                                                <th className="px-6 py-4 bg-slate-950 text-indigo-400">Color \ Size</th>
                                                {activeArticle.sizes.map(size => (
                                                    <th key={size} className="px-4 py-4 text-center border-l border-slate-800">
                                                        Size {size}
                                                    </th>
                                                ))}
                                                <th className="px-6 py-4 text-center border-l border-slate-800 bg-slate-950 text-indigo-400">
                                                    Total (Color)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 font-medium">
                                            {activeArticle.colors.map(color => (
                                                <tr key={color} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900 bg-slate-50 border-r border-slate-200 flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                                                        {color}
                                                    </td>
                                                    {activeArticle.sizes.map(size => {
                                                        const key = `${color}___${size}`;
                                                        const val = matrixInputs[key];

                                                        return (
                                                            <td key={size} className="px-3 py-3 text-center border-r border-slate-100">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    disabled={session?.status !== 'OPEN'}
                                                                    value={val ?? ''}
                                                                    onChange={e => {
                                                                        const num = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                                        setMatrixInputs(prev => ({
                                                                            ...prev,
                                                                            [key]: num
                                                                        }));
                                                                    }}
                                                                    className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-center font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4 text-center font-mono font-black text-indigo-600 bg-indigo-50/40 text-sm">
                                                        {matrixCalculations.rowTotals[color] || 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                                            <tr>
                                                <td className="px-6 py-3 uppercase tracking-wider text-slate-600 font-extrabold">Total (Size)</td>
                                                {activeArticle.sizes.map(size => (
                                                    <td key={size} className="px-4 py-3 text-center font-mono font-black text-slate-900 text-xs border-l border-slate-200">
                                                        {matrixCalculations.colTotals[size] || 0}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-3 text-center font-mono font-black text-indigo-700 bg-indigo-100 text-sm border-l border-slate-300">
                                                    {matrixCalculations.grandTotal} pcs
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: COUNTED LIST PLAN (SUMMARY & AUDIT) */}
            {activeTab === 'plan' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Counted List Plan — {session?.name}</h2>
                            <p className="text-xs text-slate-400 font-medium">Complete breakdown matrix of counted pieces per article, color, and size</p>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                        >
                            <Printer size={14} /> Print / Export Plan
                        </button>
                    </div>

                    <div className="space-y-6">
                        {sessionPlanSummary.map(summary => (
                            <div key={summary.article.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{summary.article.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-mono">{summary.article.code || 'NO-SKU'}</p>
                                    </div>
                                    <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-mono font-black text-sm">
                                        Total: {summary.totalPieces} pcs
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                                            <tr>
                                                <th className="px-4 py-2">Color</th>
                                                {summary.article.sizes.map(size => (
                                                    <th key={size} className="px-4 py-2 text-center">Size {size}</th>
                                                ))}
                                                <th className="px-4 py-2 text-center bg-slate-100">Color Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {summary.article.colors.map(color => {
                                                let rowSum = 0;
                                                return (
                                                    <tr key={color}>
                                                        <td className="px-4 py-2 font-bold text-slate-800">{color}</td>
                                                        {summary.article.sizes.map(size => {
                                                            const item = summary.items.find(i => i.color === color && i.size === size);
                                                            const qty = item?.quantity || 0;
                                                            rowSum += qty;
                                                            return (
                                                                <td key={size} className="px-4 py-2 text-center font-mono font-semibold">
                                                                    {qty > 0 ? (
                                                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-bold">{qty}</span>
                                                                    ) : (
                                                                        <span className="text-slate-300">0</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-4 py-2 text-center font-mono font-bold text-indigo-600 bg-indigo-50/30">
                                                            {rowSum} pcs
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DEFINE ARTICLE MODAL */}
            {showArticleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Define New Article & Matrix Specs</h3>
                            <button onClick={() => setShowArticleModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateArticle} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Article Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Premium Cotton Polo T-Shirt"
                                    value={articleName}
                                    onChange={e => setArticleName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Article Code / SKU (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ART-POLO-001"
                                    value={articleCode}
                                    onChange={e => setArticleCode(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Colors (Comma separated)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Black, White, Navy, Red"
                                    value={articleColors.join(', ')}
                                    onChange={e => setArticleColors(e.target.value.split(',').map(s => s.trim()))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sizes (Comma separated)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="S, M, L, XL, XXL"
                                    value={articleSizes.join(', ')}
                                    onChange={e => setArticleSizes(e.target.value.split(',').map(s => s.trim()))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowArticleModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                    Save Article Specs
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* NEW SESSION MODAL */}
            {showSessionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Start New Counting Session</h3>
                            <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Q3 Article Count - August 2026"
                                    value={newSessionName}
                                    onChange={e => setNewSessionName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSessionModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                    Start Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
