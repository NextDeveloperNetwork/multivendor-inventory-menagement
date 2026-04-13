'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, Plus, ChevronLeft, ChevronRight, Search,
    X, CheckCircle2, ClipboardList, BarChart2, ChevronDown,
    Hash, CalendarDays, Layers, AlignLeft, Boxes
} from 'lucide-react';
import { format } from 'date-fns';
import { logDailyProduction, getDailyProductionLogs, getArticleCumulativeYield } from '@/app/actions/production';
import { getProductionArticles } from '@/app/actions/productionArticles';
import { toast } from 'sonner';

/* ─── Types ─── */
interface ProcessRequirement { id: string; processName: string; unitsPerHour: number; sequence: number; }
interface AccessoryUsage { id: string; accessoryId: string; usageQuantity: number; }
interface ProductionItem {
    id: string; name: string; sku: string; type: string; unit: string;
    stockQuantity: number; totalYield?: number; description?: string; supplierName?: string;
    businessId?: string; entryDate?: string;
    processes: ProcessRequirement[]; bom: AccessoryUsage[];
}
interface SimpleManagerDashboardProps {
    user: { id: string; name: string; role: string; shopId?: string };
    todaysLogsData: any[];
    businessId?: string;
}

function dateLabel(iso?: string) {
    if (!iso) return null;
    try { return format(new Date(iso), 'dd MMM yyyy'); } catch { return iso; }
}

/* ═══════════════════════════════════════════════
   LOG CARD
═══════════════════════════════════════════════ */
function LogCard({ log, articles }: { log: any; articles: ProductionItem[] }) {
    const article = articles.find(i => i.id === log.articleId || i.sku === log.sku);
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1.5px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
            {/* Top accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg,#4f46e5,#818cf8)' }} />

            <div className="px-4 py-4">
                {/* time + sku */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>
                        {format(new Date(log.createdAt), 'HH:mm • dd MMM')}
                    </span>
                    <span
                        className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: '#0f172a', color: '#fff' }}
                    >
                        {article?.sku || log.sku || 'N/A'}
                    </span>
                </div>

                {/* name */}
                <h3 className="text-base font-black uppercase tracking-tight leading-snug" style={{ color: '#0f172a' }}>
                    {log.articleName}
                </h3>

                {/* description */}
                {article?.description && (
                    <p className="text-[11px] mt-1 leading-snug italic line-clamp-2" style={{ color: '#94a3b8' }}>
                        {article.description}
                    </p>
                )}

                {/* bottom row */}
                <div className="flex items-center justify-between mt-3">
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                        style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
                    >
                        <Package size={12} style={{ color: '#6366f1' }} />
                        <span className="text-xs font-bold" style={{ color: '#3730a3' }}>{log.boxes} Kutija</span>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black tabular-nums leading-none" style={{ color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                            {log.quantity.toLocaleString()}
                            <span className="text-xs font-bold ml-1" style={{ color: '#cbd5e1' }}>pcs</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   ARTICLE INFO CARD (shown after dropdown selection)
═══════════════════════════════════════════════ */
function ArticleInfoCard({ article, prevTotal }: { article: ProductionItem; prevTotal: number }) {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #c7d2fe', background: 'linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%)' }}
        >
            {/* Header stripe */}
            <div
                className="px-4 py-3 flex items-start justify-between"
                style={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
            >
                <div className="flex-1 min-w-0 pr-2">
                    <p className="text-indigo-200 text-[9px] uppercase tracking-widest font-bold">Artikulli i Zgjedhur</p>
                    <p className="text-white font-black text-sm leading-tight truncate mt-0.5">{article.name}</p>
                </div>
                <CheckCircle2 size={20} className="text-white/70 flex-none mt-0.5" />
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-px" style={{ background: '#d1d5db' }}>
                {/* SKU */}
                <div className="px-3 py-3 flex flex-col gap-0.5" style={{ background: '#fff' }}>
                    <div className="flex items-center gap-1">
                        <Hash size={10} style={{ color: '#6366f1' }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>SKU</span>
                    </div>
                    <p className="text-sm font-black" style={{ color: '#1e1b4b' }}>{article.sku || '—'}</p>
                </div>

                {/* Qty */}
                <div className="px-3 py-3 flex flex-col gap-0.5" style={{ background: '#fff' }}>
                    <div className="flex items-center gap-1">
                        <Boxes size={10} style={{ color: '#6366f1' }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Targeti / Mbetja</span>
                    </div>
                    <p className="text-sm font-black" style={{ color: '#1e1b4b' }}>
                        {article.stockQuantity.toLocaleString()} <span className="font-medium text-xs text-slate-400">/</span> <span className="text-indigo-600">{(article.stockQuantity - (article.totalYield || 0)).toLocaleString()}</span> <span className="font-medium text-xs" style={{ color: '#94a3b8' }}>{article.unit}</span>
                    </p>
                </div>

                {/* Date */}
                {article.entryDate && (
                    <div className="px-3 py-3 flex flex-col gap-0.5" style={{ background: '#fff' }}>
                        <div className="flex items-center gap-1">
                            <CalendarDays size={10} style={{ color: '#6366f1' }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Data</span>
                        </div>
                        <p className="text-sm font-black" style={{ color: '#1e1b4b' }}>{dateLabel(article.entryDate)}</p>
                    </div>
                )}

                {/* Cumulative */}
                <div className="px-3 py-3 flex flex-col gap-0.5" style={{ background: '#fff' }}>
                    <div className="flex items-center gap-1">
                        <Layers size={10} style={{ color: '#6366f1' }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Kumulativ</span>
                    </div>
                    <p className="text-sm font-black tabular-nums" style={{ color: '#1e1b4b' }}>
                        {prevTotal.toLocaleString()} <span className="font-medium text-xs" style={{ color: '#94a3b8' }}>pcs</span>
                    </p>
                </div>
            </div>

            {/* Description */}
            {article.description && (
                <div className="px-4 py-3" style={{ background: '#fafbff', borderTop: '1px solid #e0e7ff' }}>
                    <div className="flex items-center gap-1 mb-1">
                        <AlignLeft size={10} style={{ color: '#6366f1' }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Përshkrimi</span>
                    </div>
                    <p className="text-xs leading-relaxed italic" style={{ color: '#64748b' }}>{article.description}</p>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   PRODUCTION DIALOG SHEET
═══════════════════════════════════════════════ */
function ProductionSheet({
    open, onClose, articles, selectedDate, businessId, userId, onSuccess,
}: {
    open: boolean; onClose: () => void; articles: ProductionItem[];
    selectedDate: string; businessId?: string; userId: string; onSuccess: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [counterValue, setCounterValue] = useState('');
    const [boxes, setBoxes] = useState('');
    const [prevTotal, setPrevTotal] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const selectedArticle = articles.find(a => a.id === selectedId) || null;

    const filtered = articles.filter(a => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            a.name?.toLowerCase().includes(q) ||
            a.sku?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        );
    });

    // Load cumulative when article selected
    useEffect(() => {
        if (selectedArticle) {
            getArticleCumulativeYield(selectedArticle.name, businessId).then(setPrevTotal);
        } else {
            setPrevTotal(0);
        }
    }, [selectedArticle, businessId]);

    // Reset form on close
    useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setSelectedId('');
            setCounterValue('');
            setBoxes('');
            setPrevTotal(0);
        }
    }, [open]);

    const qty = parseInt(counterValue) || 0;
    const calculatedYield = qty > 0 ? Math.max(0, qty - prevTotal) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedArticle || calculatedYield <= 0) {
            toast.error(`Fut një vlerë mbi totalin aktual (${prevTotal})`);
            return;
        }
        setSubmitting(true);
        try {
            await logDailyProduction({
                businessId,
                workerId: userId,
                articleName: selectedArticle.name,
                quantity: calculatedYield,
                boxes: parseInt(boxes) || 0,
                date: selectedDate,
            });
            toast.success(`✓ +${calculatedYield} ${selectedArticle.unit} u regjistrua!`);
            onSuccess();
            onClose();
        } catch {
            toast.error('Gabim gjatë ruajtjes.');
        }
        setSubmitting(false);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-[28px] overflow-hidden"
                style={{ maxHeight: '94vh', background: '#f8fafc' }}
            >
                {/* ── Header ── */}
                <div style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4338ca 100%)', flexShrink: 0 }}>
                    {/* drag handle */}
                    <div className="pt-3 pb-0 flex justify-center">
                        <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                    </div>

                    <div className="px-5 pt-3 pb-5">
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <p className="text-indigo-300 text-[10px] uppercase tracking-[0.25em] font-bold">Regjistro Prodhim</p>
                                <h2 className="text-white font-black text-2xl tracking-tight mt-0.5">
                                    {format(new Date(selectedDate), 'dd MMMM yyyy')}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full flex items-center justify-center mt-0.5 flex-none"
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Search bar */}
                        <div className="relative mt-3">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Kërko emër, SKU, përshkrim…"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] font-medium outline-none"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1.5px solid rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    // @ts-ignore
                                    '::placeholder': { color: 'rgba(255,255,255,0.4)' },
                                }}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                    <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">

                        {/* ── Dropdown ── */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: '#94a3b8' }}>
                                Artikulli
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                    required
                                    className="w-full appearance-none rounded-2xl py-4 pl-5 pr-12 font-black text-sm outline-none transition-all"
                                    style={{
                                        background: '#fff',
                                        border: selectedId ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                        color: selectedId ? '#1e1b4b' : '#94a3b8',
                                        boxShadow: selectedId ? '0 0 0 4px rgba(99,102,241,0.12)' : 'none',
                                    }}
                                >
                                    <option value="">— ZGJIDH NGA LISTA —</option>
                                    {filtered.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} · {a.description}·{a.sku || '-'} · SASI: {a.stockQuantity - (a.totalYield || 0)} {a.unit} ( {a.stockQuantity})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={18}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: selectedId ? '#6366f1' : '#cbd5e1' }}
                                />
                            </div>
                            <p className="text-[10px] mt-1.5 ml-1" style={{ color: '#94a3b8' }}>
                                {filtered.length} artikuj · kërko më sipër për të filtruar
                            </p>
                        </div>

                        {/* ── Article info card ── */}
                        {selectedArticle && (
                            <ArticleInfoCard article={selectedArticle} prevTotal={prevTotal} />
                        )}

                        {/* ── Inputs (only shown when article selected) ── */}
                        {selectedArticle && (
                            <>
                                {/* Yield preview */}
                                <div
                                    className="rounded-2xl px-5 py-4 flex items-center justify-between"
                                    style={{
                                        background: calculatedYield > 0 ? '#f0fdf4' : '#f8fafc',
                                        border: `2px solid ${calculatedYield > 0 ? '#86efac' : '#e2e8f0'}`,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Prodhimi i Ri</p>
                                        <p
                                            className="text-4xl font-black tabular-nums leading-none mt-1"
                                            style={{ color: calculatedYield > 0 ? '#16a34a' : '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            +{calculatedYield.toLocaleString()}
                                            <span className="text-sm font-bold ml-1" style={{ color: '#94a3b8' }}>pcs</span>
                                        </p>
                                    </div>
                                    {calculatedYield > 0 && <CheckCircle2 size={32} style={{ color: '#4ade80' }} />}
                                </div>

                                {/* Counter + Boxes row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: '#94a3b8' }}>
                                            Totali i prodhuar
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={counterValue}
                                            onChange={e => setCounterValue(e.target.value)}
                                            placeholder="0"
                                            required
                                            className="w-full text-center text-3xl font-black py-5 rounded-2xl outline-none transition-all"
                                            style={{
                                                background: '#fff',
                                                border: counterValue ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                                color: '#0f172a',
                                                boxShadow: counterValue ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: '#94a3b8' }}>
                                            Kutija
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={boxes}
                                            onChange={e => setBoxes(e.target.value)}
                                            placeholder="0"
                                            required
                                            min="0"
                                            className="w-full text-center text-3xl font-black py-5 rounded-2xl outline-none transition-all"
                                            style={{
                                                background: '#fff',
                                                border: boxes ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                                color: '#0f172a',
                                                boxShadow: boxes ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting || calculatedYield <= 0}
                                    className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    style={{
                                        background: calculatedYield > 0
                                            ? 'linear-gradient(135deg,#1e1b4b,#4f46e5)'
                                            : '#f1f5f9',
                                        color: calculatedYield > 0 ? '#fff' : '#94a3b8',
                                        boxShadow: calculatedYield > 0 ? '0 6px 24px rgba(79,70,229,0.35)' : 'none',
                                        opacity: submitting ? 0.75 : 1,
                                    }}
                                >
                                    {submitting ? 'Duke Ruajtur…' : `Konfirmo +${calculatedYield.toLocaleString()} pcs`}
                                </button>
                            </>
                        )}

                        {/* Safe-area spacer */}
                        <div style={{ height: 32 }} />
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════ */
export default function SimpleManagerDashboard({ user, todaysLogsData, businessId }: SimpleManagerDashboardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState<ProductionItem[]>([]);
    const [todaysLogs, setTodaysLogs] = useState<any[]>(todaysLogsData);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [sheetOpen, setSheetOpen] = useState(false);

    /* Load catalog */
    useEffect(() => {
        (async () => {
            try {
                const db = await getProductionArticles(businessId, 'MANAGER');
                if (db) {
                    setItems(db.map((a: any) => ({
                        ...a,
                        entryDate: a.entryDate ? new Date(a.entryDate).toISOString().split('T')[0] : '',
                    })));
                }
            } catch { /* silent */ }
            setIsLoaded(true);
        })();
    }, [businessId]);

    /* Reload logs when date changes */
    useEffect(() => {
        getDailyProductionLogs(user.id, selectedDate).then(setTodaysLogs);
    }, [selectedDate, user.id]);

    const refreshLogs = useCallback(async () => {
        const logs = await getDailyProductionLogs(user.id, selectedDate);
        setTodaysLogs(logs);
    }, [user.id, selectedDate]);

    const shiftDate = (delta: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const totalYield = todaysLogs.reduce((s: number, l: any) => s + l.quantity, 0);

    if (!isLoaded) return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f1f5f9' }}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: '#818cf8' }}>
                    Duke ngarkuar…
                </p>
            </div>
        </div>
    );

    return (
        <>
            <ProductionSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                articles={items}
                selectedDate={selectedDate}
                businessId={businessId}
                userId={user.id}
                onSuccess={refreshLogs}
            />

            <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
                <div className="max-w-lg mx-auto px-4 pt-6 pb-32 space-y-5">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6366f1' }}>Prodhim</p>
                            <h1 className="text-xl font-black leading-tight" style={{ color: '#0f172a' }}>{user.name}</h1>
                            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Menaxher i Prodhimit</p>
                        </div>
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1e1b4b,#4338ca)' }}
                        >
                            <BarChart2 size={22} className="text-white" />
                        </div>
                    </div>

                    {/* ── Date nav ── */}
                    <div
                        className="flex items-center gap-1 p-1 rounded-2xl"
                        style={{ background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    >
                        <button
                            onClick={() => shiftDate(-1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:bg-slate-100"
                            style={{ color: '#64748b' }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="flex-1 text-center text-xs font-black bg-transparent outline-none"
                            style={{ color: '#1e1b4b' }}
                        />
                        <button
                            onClick={() => shiftDate(1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:bg-slate-100"
                            style={{ color: '#64748b' }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* ── Stats row ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="rounded-2xl p-4"
                            style={{ background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <Layers size={12} style={{ color: '#6366f1' }} />
                                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                                    Total Rendiment
                                </p>
                            </div>
                            <p className="text-3xl font-black tabular-nums leading-none" style={{ color: '#4f46e5', fontVariantNumeric: 'tabular-nums' }}>
                                {totalYield.toLocaleString()}
                            </p>
                            <p className="text-[9px] mt-1 font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>copë / {todaysLogs.length} regjistrime</p>
                        </div>

                        <button
                            onClick={() => setSheetOpen(true)}
                            className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%)',
                                boxShadow: '0 8px 24px rgba(67,56,202,0.35)',
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                                <Plus size={22} className="text-white" />
                            </div>
                            <span className="text-white font-black text-xs uppercase tracking-wider text-center leading-tight">
                                Shto Prodhim
                            </span>
                        </button>
                    </div>

                    {/* ── Logs ── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <ClipboardList size={14} style={{ color: '#94a3b8' }} />
                                <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>
                                    Regjistrimet e Ditës
                                </h2>
                            </div>
                            <span
                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: '#eef2ff', color: '#6366f1' }}
                            >
                                {todaysLogs.length} hyrje
                            </span>
                        </div>

                        {todaysLogs.length === 0 ? (
                            <div
                                className="rounded-2xl py-16 flex flex-col items-center gap-4"
                                style={{ background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                            >
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                                    <ClipboardList size={24} style={{ color: '#cbd5e1' }} />
                                </div>
                                <p className="text-xs italic" style={{ color: '#94a3b8' }}>Nuk ka prodhim regjistruar.</p>
                                <button
                                    onClick={() => setSheetOpen(true)}
                                    className="text-xs font-black uppercase tracking-wider px-5 py-2 rounded-xl transition-colors active:bg-indigo-50"
                                    style={{ border: '1.5px solid #c7d2fe', color: '#4f46e5' }}
                                >
                                    + Shto të Parin
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todaysLogs.map((log: any) => (
                                    <LogCard key={log.id} log={log} articles={items} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── FAB ── */}
            <div className="fixed bottom-6 right-5 z-40">
                <button
                    onClick={() => setSheetOpen(true)}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{
                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        boxShadow: '0 8px 28px rgba(79,70,229,0.45)',
                    }}
                >
                    <Plus size={28} className="text-white" />
                </button>
            </div>
        </>
    );
}
