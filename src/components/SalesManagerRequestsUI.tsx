'use client';

import React, { useState, useMemo } from 'react';
import {
    Boxes,
    Plus,
    Grid,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Send,
    Eye,
    Save,
    Trash2,
    Search,
    Package
} from 'lucide-react';
import {
    createCountArticle,
    deleteCountArticle,
    saveArticleMatrixCounts,
} from '@/app/actions/articleCounting';
import {
    createMatrixArticleRequest,
    deleteRequest
} from '@/app/actions/salesOps';

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
}

interface CountSession {
    id: string;
    name: string;
    status: string;
    items: CountSessionItem[];
}

interface InventoryRequest {
    id: string;
    articleId?: string | null;
    productName?: string | null;
    quantity: number;
    status: string;
    requestedBy: string;
    notes?: string | null;
    matrixDetails?: string | null;
    createdAt: string;
}

interface SalesManagerRequestsUIProps {
    articles: Article[];
    session: CountSession;
    myRequests: InventoryRequest[];
    userName: string;
}

export default function SalesManagerRequestsUI({
    articles = [],
    session,
    myRequests = [],
    userName = 'Sales Manager'
}: SalesManagerRequestsUIProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Active Dialog States
    const [countingArticle, setCountingArticle] = useState<Article | null>(null);
    const [requestingArticle, setRequestingArticle] = useState<Article | null>(null);
    const [viewingArticle, setViewingArticle] = useState<Article | null>(null);

    // Count Dialog Matrix Inputs
    const [countInputs, setCountInputs] = useState<{ [colorSizeKey: string]: number }>({});
    const [isSavingCount, setIsSavingCount] = useState(false);

    // Shortage Request Dialog Inputs
    const [requestInputs, setRequestInputs] = useState<{ [colorSizeKey: string]: number }>({});
    const [requestNotes, setRequestNotes] = useState('');
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    // Define Article Modal
    const [showDefineModal, setShowDefineModal] = useState(false);
    const [newArtName, setNewArtName] = useState('');
    const [newArtCode, setNewArtCode] = useState('');
    const [newArtColors, setNewArtColors] = useState('Black, White, Navy');
    const [newArtSizes, setNewArtSizes] = useState('S, M, L, XL, XXL');

    // Filtered Articles
    const filteredArticles = useMemo(() => {
        return articles.filter(a => {
            return (
                !searchQuery ||
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.code && a.code.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        });
    }, [articles, searchQuery]);

    // Open Count Dialog
    const handleOpenCountDialog = (art: Article) => {
        setCountingArticle(art);
        const map: { [key: string]: number } = {};
        if (session?.items) {
            session.items
                .filter(i => i.articleId === art.id)
                .forEach(i => {
                    map[`${i.color}___${i.size}`] = i.quantity;
                });
        }
        setCountInputs(map);
    };

    // Save Counts from Dialog
    const handleSaveCounts = async () => {
        if (!countingArticle || !session) return;

        setIsSavingCount(true);
        const payload: { color: string; size: string; quantity: number }[] = [];

        countingArticle.colors.forEach(color => {
            countingArticle.sizes.forEach(size => {
                const qty = countInputs[`${color}___${size}`] || 0;
                payload.push({ color, size, quantity: qty });
            });
        });

        const res = await saveArticleMatrixCounts({
            sessionId: session.id,
            articleId: countingArticle.id,
            counts: payload
        });

        if (res.success) {
            setMessage({ type: 'success', text: `Saved counting matrix for "${countingArticle.name}".` });
            setCountingArticle(null);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to save counts.' });
        }
        setIsSavingCount(false);
    };

    // Open Shortage Request Dialog
    const handleOpenRequestDialog = (art: Article) => {
        setRequestingArticle(art);
        setRequestInputs({});
        setRequestNotes('');
    };

    // Submit Matrix Shortage Request
    const handleSubmitShortageRequest = async () => {
        if (!requestingArticle) return;

        const totalQty = Object.values(requestInputs).reduce((sum, q) => sum + (q || 0), 0);
        if (totalQty <= 0) {
            setMessage({ type: 'error', text: 'Please enter request quantities greater than 0.' });
            return;
        }

        setIsSubmittingRequest(true);
        const res = await createMatrixArticleRequest({
            articleId: requestingArticle.id,
            articleName: requestingArticle.name,
            totalQuantity: totalQty,
            requestedBy: userName,
            notes: requestNotes.trim() || 'Color × Size Shortage Replenishment',
            matrixDetails: requestInputs
        });

        if (res.success) {
            setMessage({ type: 'success', text: `Shortage request submitted to Admin for "${requestingArticle.name}" (${totalQty} pcs).` });
            setRequestingArticle(null);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to submit request.' });
        }
        setIsSubmittingRequest(false);
    };

    // Create New Article Definition
    const handleCreateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newArtName.trim()) return;

        const colors = newArtColors.split(',').map(s => s.trim()).filter(Boolean);
        const sizes = newArtSizes.split(',').map(s => s.trim()).filter(Boolean);

        const res = await createCountArticle({
            name: newArtName.trim(),
            code: newArtCode.trim() || undefined,
            colors,
            sizes
        });

        if (res.success) {
            setMessage({ type: 'success', text: `Created article "${newArtName.trim()}".` });
            setShowDefineModal(false);
            setNewArtName('');
            setNewArtCode('');
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to create article.' });
        }
    };

    // Compute Totals for Count Dialog
    const countTotals = useMemo(() => {
        if (!countingArticle) return { row: {}, col: {}, total: 0 };
        const row: { [c: string]: number } = {};
        const col: { [s: string]: number } = {};
        let total = 0;

        countingArticle.colors.forEach(c => {
            row[c] = 0;
            countingArticle.sizes.forEach(s => {
                const q = countInputs[`${c}___${s}`] || 0;
                row[c] += q;
                col[s] = (col[s] || 0) + q;
                total += q;
            });
        });
        return { row, col, total };
    }, [countingArticle, countInputs]);

    // Compute Totals for Request Dialog
    const requestTotals = useMemo(() => {
        if (!requestingArticle) return { row: {}, col: {}, total: 0 };
        const row: { [c: string]: number } = {};
        const col: { [s: string]: number } = {};
        let total = 0;

        requestingArticle.colors.forEach(c => {
            row[c] = 0;
            requestingArticle.sizes.forEach(s => {
                const q = requestInputs[`${c}___${s}`] || 0;
                row[c] += q;
                col[s] = (col[s] || 0) + q;
                total += q;
            });
        });
        return { row, col, total };
    }, [requestingArticle, requestInputs]);

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto p-4 md:p-6">
            {/* Top Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Boxes size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Article Counting & Shortage Requests</h1>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">
                            Count physical articles via dialog matrix and submit shortage requests directly to Admin
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowDefineModal(true)}
                        className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={16} /> Define Article Spec
                    </button>
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

            {/* Search & Articles Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        <Grid size={18} className="text-blue-600" /> Articles Registry ({filteredArticles.length})
                    </h2>

                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search article name, code..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Mobile Card List View (Visible on iPhone / small screens < 640px) */}
                <div className="block sm:hidden space-y-3">
                    {filteredArticles.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-xs">
                            No articles found. Tap "+ Define Article Spec" to add articles.
                        </div>
                    ) : (
                        filteredArticles.map(art => {
                            const totalCounted = session?.items
                                ?.filter(i => i.articleId === art.id)
                                .reduce((sum, i) => sum + i.quantity, 0) || 0;

                            const totalRequested = myRequests
                                .filter(r => (r.articleId === art.id || r.productName === art.name) && r.status !== 'REJECTED')
                                .reduce((sum, r) => sum + r.quantity, 0);

                            return (
                                <div key={art.id} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{art.name}</h3>
                                            {art.code && <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">{art.code}</span>}
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                                totalCounted > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                Counted: {totalCounted}
                                            </span>
                                            {totalRequested > 0 && (
                                                <span className="px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] bg-purple-100 text-purple-900 border border-purple-300">
                                                    Req: {totalRequested} pcs
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-slate-500 font-medium space-y-1">
                                        <p><span className="font-bold text-slate-700">Colors:</span> {art.colors.join(', ')}</p>
                                        <p><span className="font-bold text-slate-700">Sizes:</span> {art.sizes.join(', ')}</p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            onClick={() => handleOpenCountDialog(art)}
                                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm text-center"
                                        >
                                            Count Matrix
                                        </button>
                                        <button
                                            onClick={() => handleOpenRequestDialog(art)}
                                            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm text-center"
                                        >
                                            Request Shortage
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table View (Visible on screens >= 640px) */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Article Name</th>
                                <th className="px-6 py-4">Code / SKU</th>
                                <th className="px-6 py-4">Defined Colors</th>
                                <th className="px-6 py-4">Defined Sizes</th>
                                <th className="px-6 py-4 text-center">Last Counted</th>
                                <th className="px-6 py-4 text-center">Active Requested</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                                        No articles found. Click "+ Define Article Spec" to add articles.
                                    </td>
                                </tr>
                            ) : (
                                filteredArticles.map(art => {
                                    const totalCounted = session?.items
                                        ?.filter(i => i.articleId === art.id)
                                        .reduce((sum, i) => sum + i.quantity, 0) || 0;

                                    const totalRequested = myRequests
                                        .filter(r => (r.articleId === art.id || r.productName === art.name) && r.status !== 'REJECTED')
                                        .reduce((sum, r) => sum + r.quantity, 0);

                                    return (
                                        <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                                                {art.name}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500">
                                                {art.code || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {art.colors.join(', ')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {art.sizes.join(', ')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                                                    totalCounted > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {totalCounted} pcs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {totalRequested > 0 ? (
                                                    <span className="px-3 py-1 rounded-full font-mono font-extrabold text-xs bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                                                        {totalRequested} pcs req
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 font-mono">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenCountDialog(art)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Count Article (Matrix)
                                                </button>
                                                <button
                                                    onClick={() => handleOpenRequestDialog(art)}
                                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Request Shortage
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* My Requests Queue Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">My Submitted Shortage Requests ({myRequests.length})</h2>

                {/* Mobile Requests Card List */}
                <div className="block sm:hidden space-y-3">
                    {myRequests.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 italic text-xs">
                            No shortage requests submitted yet.
                        </div>
                    ) : (
                        myRequests.map(req => (
                            <div key={req.id} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-slate-900">#{req.id.slice(-6).toUpperCase()}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between font-bold">
                                    <span className="text-slate-900 text-sm">{req.productName || 'Article Request'}</span>
                                    <span className="font-mono text-purple-700 text-sm">{req.quantity} pcs</span>
                                </div>
                                <div>
                                    {req.status === 'PENDING' && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1">
                                            <Clock size={10} /> Pending Approval
                                        </span>
                                    )}
                                    {req.status === 'APPROVED' && (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] inline-flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Approved
                                        </span>
                                    )}
                                    {req.status === 'FULFILLED' && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Dispatched / Fulfilled
                                        </span>
                                    )}
                                    {req.status === 'REJECTED' && (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1">
                                            <XCircle size={10} /> Rejected
                                        </span>
                                    )}
                                </div>
                                {req.notes && <p className="text-slate-500 text-[11px] italic">"{req.notes}"</p>}
                                {req.status === 'PENDING' && (
                                    <button
                                        onClick={() => deleteRequest(req.id)}
                                        className="w-full py-1.5 mt-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-center rounded-lg text-[11px]"
                                    >
                                        Cancel Request
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Requests Table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Request ID / Date</th>
                                <th className="px-6 py-4">Article</th>
                                <th className="px-6 py-4 text-center">Requested Qty</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Notes</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {myRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                        No shortage requests submitted yet.
                                    </td>
                                </tr>
                            ) : (
                                myRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-bold text-slate-900">#{req.id.slice(-6).toUpperCase()}</div>
                                            <div className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {req.productName || 'Article Request'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-black text-slate-900 text-sm">
                                            {req.quantity} pcs
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'PENDING' && (
                                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                    <Clock size={12} /> Pending Admin Approval
                                                </span>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                    <CheckCircle2 size={12} /> Approved
                                                </span>
                                            )}
                                            {req.status === 'FULFILLED' && (
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                    <CheckCircle2 size={12} /> Dispatched / Fulfilled
                                                </span>
                                            )}
                                            {req.status === 'REJECTED' && (
                                                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                    <XCircle size={12} /> Rejected
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {req.notes || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <button
                                                    onClick={() => deleteRequest(req.id)}
                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold"
                                                >
                                                    Cancel Request
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* COUNT ARTICLE MATRIX DIALOG */}
            {countingArticle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    Count Matrix: {countingArticle.name}
                                    {countingArticle.code && (
                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            {countingArticle.code}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Enter physical pieces counted per Color and Size cell</p>
                            </div>
                            <button onClick={() => setCountingArticle(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={22} />
                            </button>
                        </div>

                        {/* Mobile Color Cards Entry View (Visible on iPhone / small screens < 640px) */}
                        <div className="block sm:hidden space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                            {countingArticle.colors.map(color => (
                                <div key={color} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                            {color}
                                        </span>
                                        <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            {countTotals.row[color] || 0} pcs
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {countingArticle.sizes.map(size => {
                                            const key = `${color}___${size}`;
                                            const val = countInputs[key];
                                            return (
                                                <div key={size} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between shadow-2xs">
                                                    <span className="text-xs font-bold text-slate-700 font-mono">Size {size}:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={val ?? ''}
                                                        onChange={e => {
                                                            const num = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                            setCountInputs(prev => ({
                                                                ...prev,
                                                                [key]: num
                                                            }));
                                                        }}
                                                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 focus:bg-white rounded font-mono font-bold text-center text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Table Grid (Visible on screens >= 640px) */}
                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3.5 bg-slate-950 text-indigo-400 sticky left-0 z-20 shadow-xs">Color \ Size</th>
                                        {countingArticle.sizes.map(size => (
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
                                    {countingArticle.colors.map(color => (
                                        <tr key={color} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 sm:px-6 py-3.5 font-bold text-slate-900 bg-slate-100 sticky left-0 z-10 border-r border-slate-200 shadow-xs">
                                                {color}
                                            </td>
                                            {countingArticle.sizes.map(size => {
                                                const key = `${color}___${size}`;
                                                const val = countInputs[key];

                                                return (
                                                    <td key={size} className="px-3 py-3 text-center border-r border-slate-100">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={val ?? ''}
                                                            onChange={e => {
                                                                const num = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                                setCountInputs(prev => ({
                                                                    ...prev,
                                                                    [key]: num
                                                                }));
                                                            }}
                                                            className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-center font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-center font-mono font-black text-blue-600 bg-blue-50/40 text-sm">
                                                {countTotals.row[color] || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                                    <tr>
                                        <td className="px-6 py-3 uppercase tracking-wider text-slate-600 font-extrabold">Total (Size)</td>
                                        {countingArticle.sizes.map(size => (
                                            <td key={size} className="px-4 py-3 text-center font-mono font-black text-slate-900 text-xs border-l border-slate-200">
                                                {countTotals.col[size] || 0}
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 text-center font-mono font-black text-blue-700 bg-blue-100 text-sm border-l border-slate-300">
                                            {countTotals.total} pcs
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <div className="text-xs font-bold text-slate-900 font-mono">
                                Grand Total: <span className="text-blue-700 text-sm">{countTotals.total} pcs</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCountingArticle(null)}
                                    className="px-3 sm:px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCounts}
                                    disabled={isSavingCount}
                                    className="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                                >
                                    <Save size={16} /> {isSavingCount ? 'Saving...' : 'Save Matrix Counts'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SHORTAGE REQUEST MATRIX DIALOG */}
            {requestingArticle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                                        Request Shortage: {requestingArticle.name}
                                    </h3>
                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-mono text-[11px] font-bold">
                                        Hand: {session?.items?.filter(i => i.articleId === requestingArticle.id).reduce((sum, i) => sum + i.quantity, 0) || 0} pcs
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">Specify missing pieces required per Color & Size matrix</p>
                            </div>
                            <button onClick={() => setRequestingArticle(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={22} />
                            </button>
                        </div>

                        {/* Mobile Color Cards Entry View for Shortage Request (< 640px) */}
                        <div className="block sm:hidden space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                            {requestingArticle.colors.map(color => (
                                <div key={color} className="bg-amber-50/40 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                                            {color}
                                        </span>
                                        <span className="text-xs font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                            Req: {requestTotals.row[color] || 0} pcs
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {requestingArticle.sizes.map(size => {
                                            const key = `${color}___${size}`;
                                            const val = requestInputs[key];
                                            const atHand = session?.items?.find(i => i.articleId === requestingArticle.id && i.color === color && i.size === size)?.quantity || 0;
                                            let alreadyReq = 0;
                                            myRequests
                                                .filter(r => (r.articleId === requestingArticle.id || r.productName === requestingArticle.name) && r.status !== 'REJECTED' && r.matrixDetails)
                                                .forEach(r => {
                                                    try {
                                                        const parsed = JSON.parse(r.matrixDetails!);
                                                        alreadyReq += (parsed[`${color}___${size}`] || 0);
                                                    } catch (e) {}
                                                });

                                            return (
                                                <div key={size} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-800 block font-mono">Size {size}</span>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                                                atHand === 0 ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                            }`}>
                                                                Hand: {atHand}
                                                            </span>
                                                            {alreadyReq > 0 && (
                                                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
                                                                    Req: {alreadyReq}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Need"
                                                        value={val ?? ''}
                                                        onChange={e => {
                                                            const num = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                            setRequestInputs(prev => ({
                                                                ...prev,
                                                                [key]: num
                                                            }));
                                                        }}
                                                        className="w-20 px-2 py-1.5 bg-amber-50/50 border border-amber-200 focus:bg-white rounded font-mono font-bold text-center text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Request Matrix Grid (Visible on screens >= 640px) */}
                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-amber-500 text-white uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3.5 bg-amber-700 text-white sticky left-0 z-20 shadow-xs">Color \ Size</th>
                                        {requestingArticle.sizes.map(size => (
                                            <th key={size} className="px-4 py-4 text-center border-l border-amber-400">
                                                Size {size}
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-center border-l border-amber-400 bg-amber-600">
                                            Request Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    {requestingArticle.colors.map(color => (
                                        <tr key={color} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 sm:px-6 py-3.5 font-bold text-slate-900 bg-amber-100 sticky left-0 z-10 border-r border-amber-300 shadow-xs">
                                                {color}
                                            </td>
                                            {requestingArticle.sizes.map(size => {
                                                const key = `${color}___${size}`;
                                                const val = requestInputs[key];
                                                const atHand = session?.items?.find(i => i.articleId === requestingArticle.id && i.color === color && i.size === size)?.quantity || 0;

                                                let alreadyReq = 0;
                                                myRequests
                                                    .filter(r => (r.articleId === requestingArticle.id || r.productName === requestingArticle.name) && r.status !== 'REJECTED' && r.matrixDetails)
                                                    .forEach(r => {
                                                        try {
                                                            const parsed = JSON.parse(r.matrixDetails!);
                                                            alreadyReq += (parsed[`${color}___${size}`] || 0);
                                                        } catch (e) {}
                                                    });

                                                return (
                                                    <td key={size} className="px-3 py-3.5 text-center border-r border-slate-100 bg-slate-50/20">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <span
                                                                    title={`Quantity at hand: ${atHand}`}
                                                                    className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                                                                        atHand === 0
                                                                            ? 'bg-rose-100 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                                                                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                                    }`}
                                                                >
                                                                    {atHand}
                                                                </span>
                                                                {alreadyReq > 0 && (
                                                                    <span
                                                                        title={`Already requested: ${alreadyReq} pcs`}
                                                                        className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs"
                                                                    >
                                                                        Req: {alreadyReq}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="Need"
                                                                value={val ?? ''}
                                                                onChange={e => {
                                                                    const num = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                                    setRequestInputs(prev => ({
                                                                        ...prev,
                                                                        [key]: num
                                                                    }));
                                                                }}
                                                                className="w-20 px-2 py-1.5 bg-amber-50/40 border border-amber-200 focus:bg-white rounded-lg text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-center font-mono font-black text-amber-700 bg-amber-50 text-sm">
                                                {requestTotals.row[color] || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Request Notes / Reason</label>
                            <input
                                type="text"
                                placeholder="Specify store branch urgency or restock priority..."
                                value={requestNotes}
                                onChange={e => setRequestNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                onClick={() => setRequestingArticle(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitShortageRequest}
                                disabled={isSubmittingRequest || requestTotals.total <= 0}
                                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                            >
                                <Send size={16} /> {isSubmittingRequest ? 'Submitting...' : `Submit Request to Admin (${requestTotals.total} pcs)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DEFINE ARTICLE MODAL */}
            {showDefineModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Define New Article Spec</h3>
                            <button onClick={() => setShowDefineModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateArticle} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Article Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Cotton Crewneck Sweater"
                                    value={newArtName}
                                    onChange={e => setNewArtName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Code / SKU (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ART-SWEATER-02"
                                    value={newArtCode}
                                    onChange={e => setNewArtCode(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Colors (Comma separated)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Black, White, Navy, Olive"
                                    value={newArtColors}
                                    onChange={e => setNewArtColors(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sizes (Comma separated)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="S, M, L, XL, XXL"
                                    value={newArtSizes}
                                    onChange={e => setNewArtSizes(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDefineModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                    Save Article Spec
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
