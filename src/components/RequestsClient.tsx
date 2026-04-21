'use client';

import React, { useState } from 'react';
import {
    ClipboardList, Package, Clock, Trash2, X, Plus, Minus,
    Loader2, Search, SlidersHorizontal, CheckCircle2,
    AlertTriangle, RotateCcw, Send, FileText, User,
    Check, ChevronDown, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteRequest, createInventoryRequest } from '@/app/actions/salesOps';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface Request {
    id: string;
    productName: string;
    productId?: string | null;
    quantity: number;
    status: string;
    notes?: string | null;
    requestedBy: string;
    createdAt: string | Date;
    product?: { name: string } | null;
}

interface Props {
    initialRequests: any[];
    products: any[];
    userName: string;
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

const PERIODS = [
    { label: 'Today', getDates: () => { const t = new Date().toISOString().split('T')[0]; return [t, t]; } },
    { label: 'Week', getDates: () => { const now = new Date(); const s = new Date(now); s.setDate(now.getDate() - 6); return [s.toISOString().split('T')[0], now.toISOString().split('T')[0]]; } },
    { label: 'Month', getDates: () => { const n = new Date(); return [new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0], new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().split('T')[0]]; } },
    { label: 'All', getDates: () => ['', ''] },
];

const statusCfg = (s: string) => ({
    PENDING: { accent: 'from-amber-400 to-orange-400', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-500', dot: 'bg-amber-400', label: 'Pending' },
    APPROVED: { accent: 'from-emerald-400 to-teal-500', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, iconColor: 'text-emerald-500', dot: 'bg-emerald-500', label: 'Approved' },
    REJECTED: { accent: 'from-rose-400 to-red-500', badge: 'bg-rose-100 text-rose-700', icon: X, iconColor: 'text-rose-500', dot: 'bg-rose-500', label: 'Rejected' },
}[s] || { accent: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-600', icon: RotateCcw, iconColor: 'text-slate-400', dot: 'bg-slate-400', label: s });

export default function RequestsClient({ initialRequests, products, userName }: Props) {
    const [requests, setRequests] = useState<Request[]>(initialRequests);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    // Date filter state — default to current month
    const now = new Date();
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    const [activePeriod, setActivePeriod] = useState('Month');

    const applyPeriod = (label: string) => {
        const p = PERIODS.find(x => x.label === label);
        if (!p) return;
        const [s, e] = p.getDates();
        setStartDate(s); setEndDate(e); setActivePeriod(label);
    };

    const filtered = requests.filter(r => {
        const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
        const name = r.product?.name || r.productName || '';
        const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || r.requestedBy.toLowerCase().includes(search.toLowerCase());
        const dDate = new Date(r.createdAt).toISOString().split('T')[0];
        const matchDate = (!startDate || dDate >= startDate) && (!endDate || dDate <= endDate);
        return matchStatus && matchSearch && matchDate;
    });

    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this request?')) return;
        setIsProcessing(id);
        const res = await deleteRequest(id);
        setIsProcessing(null);
        if (res.success) {
            toast.success('Request deleted');
            setRequests(prev => prev.filter(r => r.id !== id));
        } else toast.error(res.error || 'Delete failed');
    };

    return (
        <div className="flex flex-col min-h-full bg-slate-950">

            {/* ── DARK HERO ── */}
            <div className="relative overflow-hidden px-5 pt-6 pb-8 bg-slate-950">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -mr-36 -mt-36 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/8 rounded-full blur-3xl -ml-24 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-7">
                        <div>
                            <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-[0.3em] mb-1">Inventory Ops</p>
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Restock <span className="text-blue-400">Requests</span>
                            </h1>
                        </div>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/40 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} /> New
                        </button>
                    </div>

                    {/* Stat chips — tappable filters */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {[
                            { label: 'Pending', count: pending, key: 'PENDING', color: 'text-amber-400', Icon: AlertTriangle },
                            { label: 'Approved', count: approved, key: 'APPROVED', color: 'text-emerald-400', Icon: CheckCircle2 },
                            { label: 'Rejected', count: rejected, key: 'REJECTED', color: 'text-rose-400', Icon: X },
                        ].map(s => (
                            <button key={s.key}
                                onClick={() => setStatusFilter(f => f === s.key ? 'ALL' : s.key)}
                                className={cn("bg-white/5 border border-white/10 rounded-2xl p-3 text-left transition-all active:scale-95",
                                    statusFilter === s.key && "border-white/30 bg-white/10"
                                )}
                            >
                                <s.Icon size={14} className={cn("mb-1.5", s.color)} />
                                <p className="text-xl font-black tabular-nums text-white leading-none">{s.count}</p>
                                <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5", s.color)}>{s.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Requisitions</span>
                        <span className="text-xl font-black text-white tabular-nums">{requests.length}</span>
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ── */}
            <div className="bg-slate-950 px-5 pb-4 space-y-3">
                {/* Status chips */}
                <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => (
                        <button key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95",
                                statusFilter === s ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-white/5 text-white/40 border border-white/10"
                            )}
                        >
                            {s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={cn("w-11 rounded-xl flex items-center justify-center border transition-all active:scale-95",
                            showFilters ? "bg-blue-500 text-white border-blue-500" : "bg-white/5 text-white/40 border-white/10"
                        )}
                    >
                        <SlidersHorizontal size={14} />
                    </button>
                </div>

                {/* Period chips */}
                <div className="flex gap-2">
                    {PERIODS.map(p => (
                        <button key={p.label}
                            onClick={() => applyPeriod(p.label)}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                                activePeriod === p.label ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "bg-white/5 text-white/40 border border-white/10"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {showFilters && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                        {/* Date range */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">From</label>
                                <input type="date" value={startDate}
                                    onChange={e => { setStartDate(e.target.value); setActivePeriod(''); }}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">To</label>
                                <input type="date" value={endDate}
                                    onChange={e => { setEndDate(e.target.value); setActivePeriod(''); }}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" />
                            </div>
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                            <input
                                type="text"
                                placeholder="Search by product or requester..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── REQUEST LIST ── */}
            <div className="flex-1 bg-slate-100 rounded-t-[2rem] px-4 pt-5 pb-36 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} requests</span>
                    {search && (
                        <button onClick={() => setSearch('')} className="text-[9px] font-bold text-blue-600 flex items-center gap-1">
                            <X size={10} /> Clear
                        </button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                            <ClipboardList size={28} className="text-slate-200" />
                        </div>
                        <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">No Requests Found</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5 max-w-[200px] leading-relaxed">
                            Submit a new restock request to get started.
                        </p>
                    </div>
                ) : filtered.map(req => {
                    const name = req.product?.name || req.productName || 'Unnamed Item';
                    const cfg = statusCfg(req.status);
                    const StatusIcon = cfg.icon;
                    return (
                        <div key={req.id} className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100/80 active:scale-[0.99] transition-transform">
                            <div className={cn("h-1 bg-gradient-to-r", cfg.accent)} />
                            <div className="p-4">
                                {/* Row: icon + info + qty */}
                                <div className="flex items-start gap-3">
                                    <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                                        req.status === 'APPROVED' ? 'bg-emerald-50' : req.status === 'REJECTED' ? 'bg-rose-50' : 'bg-amber-50'
                                    )}>
                                        <StatusIcon size={18} className={cfg.iconColor} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest", cfg.badge)}>
                                                {cfg.label}
                                            </span>
                                            <span className="text-[8px] text-slate-300 font-bold">#{req.id.slice(-6)}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{name}</p>

                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                                                ×{req.quantity} units
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <User size={10} className="text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{req.requestedBy}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} className="text-slate-300" />
                                                <span className="text-[10px] text-slate-400 font-bold" suppressHydrationWarning>
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>

                                        {req.notes && (
                                            <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2 mt-3 border border-slate-100">
                                                <FileText size={11} className="text-slate-400 mt-0.5 shrink-0" />
                                                <p className="text-[10px] text-slate-500 italic leading-relaxed">{req.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delete action */}
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        disabled={isProcessing === req.id}
                                        className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 disabled:opacity-40"
                                    >
                                        {isProcessing === req.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── CREATE REQUEST SHEET ── */}
            <CreateRequestSheet
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                products={products}
                userName={userName}
                onCreated={(req) => setRequests(prev => [req, ...prev])}
            />
        </div>
    );
}

// ── Create Request Sheet ──
function CreateRequestSheet({ open, onClose, products, userName, onCreated }: {
    open: boolean;
    onClose: () => void;
    products: any[];
    userName: string;
    onCreated: (req: any) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productName.toLowerCase())
    ).slice(0, 8);

    const handleSubmit = async () => {
        if (!productName.trim() || quantity <= 0) { toast.error('Enter item name and quantity'); return; }
        setIsLoading(true);
        const res = await createInventoryRequest({ productId, productName, quantity, notes, requestedBy: userName });
        setIsLoading(false);
        if (res.success) {
            toast.success('Request submitted');
            onCreated({
                id: res.requestId || Math.random().toString(36),
                productName,
                productId,
                quantity,
                status: 'PENDING',
                notes,
                requestedBy: userName,
                createdAt: new Date().toISOString(),
            });
            setProductName(''); setProductId(''); setQuantity(1); setNotes('');
            onClose();
        } else toast.error(res.error || 'Failed to submit');
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-100 rounded-t-[2.5rem] max-h-[92dvh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.3)] overflow-hidden">

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <ClipboardList size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase italic tracking-tight text-slate-900 leading-none">New Request</h2>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Inventory Requisition</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                    {/* Product selector */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Product</p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Type product name..."
                                value={productName}
                                onChange={e => { setProductName(e.target.value); setProductId(''); setShowDropdown(true); }}
                                onFocus={() => setShowDropdown(true)}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                            />
                            {productName && (
                                <button onClick={() => { setProductName(''); setProductId(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                    <X size={12} />
                                </button>
                            )}

                            {/* Dropdown */}
                            {showDropdown && filteredProducts.length > 0 && (
                                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                    {filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => { setProductName(p.name); setProductId(p.id); setShowDropdown(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-none active:bg-slate-100">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <Package size={13} className="text-blue-500" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Quantity</p>
                        <div className="flex items-center h-14 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                            <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-14 h-full flex items-center justify-center text-slate-500 active:bg-slate-100 border-r border-slate-200">
                                <Minus size={18} />
                            </button>
                            <input type="number" value={quantity} min={1}
                                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                className="flex-1 bg-transparent text-center text-2xl font-black text-slate-900 outline-none tabular-nums" />
                            <button type="button" onClick={() => setQuantity(q => q + 1)}
                                className="w-14 h-full flex items-center justify-center text-slate-500 active:bg-slate-100 border-l border-slate-200">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Requester badge */}
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">
                            {userName[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-blue-900 uppercase tracking-wide">{userName}</p>
                            <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Authorized Requester</p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Notes (optional)</p>
                        <textarea
                            placeholder="Urgency level, reason, deadline..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 resize-none transition-all"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pt-3 pb-8 border-t border-slate-200/60 bg-slate-100 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !productName.trim()}
                        className="w-full h-14 bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/30 disabled:opacity-40"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Submit Request</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
