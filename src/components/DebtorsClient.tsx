'use client';

import React, { useState } from 'react';
import {
    Phone, Clock, Trash2, Edit3, X, Plus, Minus,
    Package, Loader2, Search, SlidersHorizontal,
    UserMinus, CheckCircle2, AlertTriangle, TrendingDown,
    FileText, Check, Wallet, Send, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteDebtor, recordPayment, updateDebtor, createDebtor } from '@/app/actions/salesOps';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface DebtorItem { productName: string; quantity: number; price: number; total: number; }
interface Debtor {
    id: string; name: string; phone?: string | null;
    amount: number; paidAmount: number; status: string;
    notes?: string | null; createdAt: string | Date;
    debtDate?: string | Date | null;
    items: DebtorItem[];
}

interface Props { initialDebtors: any[]; currencySymbol?: string; }

const STATUS_FILTERS = ['ALL', 'UNPAID', 'PARTIAL', 'PAID'];

export default function DebtorsClient({ initialDebtors, currencySymbol = '$' }: Props) {
    const [debtors, setDebtors] = useState<Debtor[]>(initialDebtors);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // Settlement sheet
    const [settling, setSettling] = useState<Debtor | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);

    // Edit sheet
    const [editing, setEditing] = useState<Debtor | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editItems, setEditItems] = useState<DebtorItem[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newItem, setNewItem] = useState<DebtorItem>({ productName: '', quantity: 1, price: 0, total: 0 });

    // Filtering
    const filtered = debtors.filter(d => {
        const matchSearch = !search ||
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.phone?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalOwed = filtered.reduce((s, d) => s + (Number(d.amount) - Number(d.paidAmount)), 0);
    const totalPaid = filtered.reduce((s, d) => s + Number(d.paidAmount), 0);

    // ── DELETE ──
    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this debtor?')) return;
        setIsProcessing(id);
        const res = await deleteDebtor(id);
        setIsProcessing(null);
        if (res.success) {
            toast.success('Debtor removed');
            setDebtors(d => d.filter(x => x.id !== id));
        } else toast.error(res.error || 'Delete failed');
    };

    // ── SETTLE ──
    const openSettle = (d: Debtor) => { setSettling(d); setPayAmount((Number(d.amount) - Number(d.paidAmount)).toString()); };
    const handlePay = async () => {
        if (!settling || !payAmount || isNaN(Number(payAmount))) { toast.error('Enter a valid amount'); return; }
        setIsPaying(true);
        const res = await recordPayment(settling.id, Number(payAmount));
        setIsPaying(false);
        if (res.success) {
            toast.success('Payment recorded');
            setDebtors(prev => prev.map(d => {
                if (d.id !== settling.id) return d;
                const newPaid = Number(d.paidAmount) + Number(payAmount);
                const total = Number(d.amount);
                const status = newPaid >= total ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';
                return { ...d, paidAmount: newPaid, status };
            }));
            setSettling(null);
            setPayAmount('');
        } else toast.error(res.error || 'Payment failed');
    };

    // ── EDIT ──
    const openEdit = (d: Debtor) => {
        setEditing(d);
        setEditName(d.name);
        setEditPhone(d.phone || '');
        setEditNotes(d.notes || '');
        setEditItems([...d.items]);
        setNewItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };
    const addEditItem = () => {
        if (!newItem.productName.trim() || newItem.quantity <= 0 || newItem.price <= 0) { toast.error('Fill all item fields'); return; }
        setEditItems(prev => [...prev, { ...newItem, total: newItem.quantity * newItem.price }]);
        setNewItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };
    const handleUpdate = async () => {
        if (!editing || !editName.trim()) { toast.error('Name is required'); return; }
        if (editItems.length === 0) { toast.error('Add at least one item'); return; }
        setIsUpdating(true);
        const amount = editItems.reduce((s, i) => s + i.total, 0);
        const res = await updateDebtor(editing.id, { name: editName, phone: editPhone, amount, notes: editNotes, items: editItems });
        setIsUpdating(false);
        if (res.success) {
            toast.success('Debtor updated');
            setDebtors(prev => prev.map(d => d.id === editing.id
                ? { ...d, name: editName, phone: editPhone, notes: editNotes, amount, items: editItems }
                : d
            ));
            setEditing(null);
        } else toast.error(res.error || 'Update failed');
    };

    const statusCfg = (s: string) => ({
        UNPAID: { accent: 'from-rose-400 to-red-500', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-400', dot: 'bg-rose-500', label: 'Unpaid' },
        PARTIAL: { accent: 'from-amber-400 to-orange-400', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', dot: 'bg-amber-500', label: 'Partial' },
        PAID: { accent: 'from-emerald-400 to-teal-500', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', dot: 'bg-emerald-500', label: 'Paid' },
    }[s] || { accent: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400', dot: 'bg-slate-400', label: s });

    return (
        <div className="flex flex-col min-h-full bg-slate-950">

            {/* ── DARK HERO ── */}
            <div className="relative overflow-hidden px-5 pt-6 pb-8 bg-slate-950">
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl -mr-36 -mt-36 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/8 rounded-full blur-3xl -ml-24 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-7">
                        <div>
                            <p className="text-[10px] font-bold text-violet-400/70 uppercase tracking-[0.3em] mb-1">Credit Management</p>
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Debtors <span className="text-violet-400">Ledger</span>
                            </h1>
                        </div>
                        <CreateDebtorInline currencySymbol={currencySymbol} />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {[
                            { label: 'Unpaid', count: debtors.filter(d => d.status === 'UNPAID').length, color: 'text-rose-400', icon: AlertTriangle },
                            { label: 'Partial', count: debtors.filter(d => d.status === 'PARTIAL').length, color: 'text-amber-400', icon: TrendingDown },
                            { label: 'Settled', count: debtors.filter(d => d.status === 'PAID').length, color: 'text-emerald-400', icon: CheckCircle2 },
                        ].map(s => (
                            <button key={s.label}
                                onClick={() => setStatusFilter(filter => filter === s.label.toUpperCase() ? 'ALL' : s.label.toUpperCase())}
                                className={cn("bg-white/5 border border-white/10 rounded-2xl p-3 text-left transition-all active:scale-95",
                                    statusFilter === s.label.toUpperCase() && "border-white/30 bg-white/10"
                                )}
                            >
                                <s.icon size={14} className={cn("mb-1.5", s.color)} />
                                <p className={cn("text-xl font-black tabular-nums text-white leading-none")}>{s.count}</p>
                                <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5", s.color)}>{s.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Balance pill */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Net Outstanding Balance</p>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tight">
                            {currencySymbol}<span className="text-violet-400">{totalOwed.toLocaleString()}</span>
                        </p>
                        {totalPaid > 0 && (
                            <p className="text-[10px] font-bold text-emerald-400 mt-1">
                                {currencySymbol}{totalPaid.toLocaleString()} recovered
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ── */}
            <div className="bg-slate-950 px-5 pb-4 space-y-3">
                <div className="flex gap-2">
                    {STATUS_FILTERS.map(s => (
                        <button key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95",
                                statusFilter === s ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-white/5 text-white/40 border border-white/10"
                            )}
                        >
                            {s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={cn("w-11 rounded-xl flex items-center justify-center border transition-all active:scale-95",
                            showFilters ? "bg-violet-500 text-white border-violet-500" : "bg-white/5 text-white/40 border-white/10"
                        )}
                    >
                        <SlidersHorizontal size={14} />
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white outline-none focus:border-violet-500 transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── DEBTORS LIST ── */}
            <div className="flex-1 bg-slate-100 rounded-t-[2rem] px-4 pt-5 pb-36 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} accounts</span>
                    {search && (
                        <button onClick={() => setSearch('')} className="text-[9px] font-bold text-violet-600 flex items-center gap-1">
                            <X size={10} /> Clear
                        </button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                            <UserMinus size={28} className="text-slate-200" />
                        </div>
                        <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">No Records Found</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5 max-w-[200px] leading-relaxed">
                            Adjust filters or register a new credit dispatch.
                        </p>
                    </div>
                ) : filtered.map(debtor => {
                    const total = Number(debtor.amount);
                    const paid = Number(debtor.paidAmount);
                    const owed = total - paid;
                    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                    const cfg = statusCfg(debtor.status);

                    return (
                        <div key={debtor.id} className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100/80 active:scale-[0.99] transition-transform">
                            <div className={cn("h-1 bg-gradient-to-r", cfg.accent)} />

                            <div className="p-4">
                                {/* Row: avatar + info + balance */}
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 bg-gradient-to-br", cfg.accent)}>
                                        {debtor.name[0]?.toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest", cfg.badge)}>
                                                {cfg.label}
                                            </span>
                                            <span className="text-[8px] text-slate-300">#{debtor.id.slice(-6)}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{debtor.name}</p>
                                        {debtor.phone && (
                                            <a href={`tel:${debtor.phone}`} className="flex items-center gap-1.5 mt-0.5">
                                                <Phone size={10} className="text-slate-400" />
                                                <span className="text-[11px] text-slate-500 font-medium">{debtor.phone}</span>
                                            </a>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Owes</p>
                                        <p className={cn("text-xl font-black tabular-nums leading-tight", owed > 0 ? "text-rose-600" : "text-emerald-600")}>
                                            {currencySymbol}{owed.toLocaleString()}
                                        </p>
                                        {paid > 0 && <p className="text-[9px] text-emerald-500 font-bold">+{currencySymbol}{paid.toLocaleString()}</p>}
                                    </div>
                                </div>

                                {/* Recovery bar */}
                                {total > 0 && (
                                    <div className="mt-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Recovery</span>
                                            <span className="text-[8px] font-bold text-slate-500">{pct.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", cfg.bar)} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )}

                                {/* Article chips */}
                                {debtor.items?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {debtor.items.map((item, i) => (
                                            <span key={i} className="text-[9px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                                {item.quantity}× {item.productName}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {debtor.notes && (
                                    <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2 mt-3 border border-slate-100">
                                        <FileText size={11} className="text-slate-400 mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-slate-500 italic leading-relaxed">{debtor.notes}</p>
                                    </div>
                                )}

                                {/* Timestamp */}
                                <div className="flex items-center gap-1.5 mt-3">
                                    <Calendar size={9} className="text-slate-300" />
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest" suppressHydrationWarning>
                                        {new Date(debtor.debtDate || debtor.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    {debtor.status !== 'PAID' && (
                                        <button
                                            onClick={() => openSettle(debtor)}
                                            className="flex-1 h-11 bg-violet-50 border border-violet-100 text-violet-700 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <Wallet size={14} /> Settle
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openEdit(debtor)}
                                        className="flex-1 h-11 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-violet-50 hover:text-violet-700 hover:border-violet-100"
                                    >
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(debtor.id)}
                                        disabled={isProcessing === debtor.id}
                                        className="w-11 h-11 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 disabled:opacity-40"
                                    >
                                        {isProcessing === debtor.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── SETTLEMENT SHEET ── */}
            <Dialog open={!!settling} onOpenChange={o => !o && setSettling(null)}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none w-full m-0 fixed bottom-0 top-auto translate-y-0 rounded-none data-[state=open]:animate-none">
                    <div className="bg-slate-100 rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>Enter the payment amount to settle this debt.</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-300 rounded-full" /></div>

                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
                            <div>
                                <h2 className="text-base font-black text-slate-900 uppercase italic tracking-tight leading-none">Record Payment</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{settling?.name}</p>
                            </div>
                            <button onClick={() => setSettling(null)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-5 py-6 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Debt</p>
                                    <p className="text-lg font-black text-slate-900">{currencySymbol}{Number(settling?.amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                                    <p className="text-lg font-black text-rose-600">
                                        {currencySymbol}{(Number(settling?.amount || 0) - Number(settling?.paidAmount || 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                                <div className="flex items-center h-16">
                                    <span className="pl-5 text-xl font-black text-slate-400 shrink-0">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={payAmount}
                                        onChange={e => setPayAmount(e.target.value)}
                                        className="flex-1 pl-2 pr-5 bg-transparent text-2xl font-black text-slate-900 outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-8 flex gap-3">
                            <button onClick={() => setSettling(null)} className="h-14 px-6 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95">
                                Cancel
                            </button>
                            <button
                                onClick={handlePay}
                                disabled={isPaying || !payAmount}
                                className="flex-1 h-14 bg-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-violet-500/30 disabled:opacity-40"
                            >
                                {isPaying ? <Loader2 size={20} className="animate-spin" /> : <><Check size={18} /> Confirm Payment</>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── EDIT SHEET ── */}
            <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none w-full m-0 fixed bottom-0 top-auto translate-y-0 rounded-none data-[state=open]:animate-none">
                    <div className="bg-slate-100 rounded-t-[2.5rem] max-h-[92dvh] flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Edit Debtor</DialogTitle>
                            <DialogDescription>Modify the details of this credit entry.</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-300 rounded-full" /></div>

                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
                            <div>
                                <h2 className="text-base font-black text-slate-900 uppercase italic tracking-tight leading-none">Edit Debtor</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{editing?.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setEditing(null)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                            {/* Client info */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Client Info</p>
                                <input type="text" placeholder="Client name..." value={editName} onChange={e => setEditName(e.target.value)}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 transition-all" />
                                <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="pl-4 pr-2 shrink-0"><Phone size={15} className="text-slate-400" /></div>
                                    <input type="tel" placeholder="Phone number..." value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                        className="flex-1 pr-4 bg-transparent text-sm font-medium text-slate-900 outline-none" />
                                </div>
                            </div>

                            {/* Add item */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Add Item</p>
                                <input type="text" placeholder="Article description..." value={newItem.productName}
                                    onChange={e => setNewItem({ ...newItem, productName: e.target.value })}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 transition-all" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <button type="button" onClick={() => setNewItem(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))} className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100"><Minus size={14} /></button>
                                        <input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className="flex-1 bg-transparent text-center text-sm font-black text-slate-900 outline-none" />
                                        <button type="button" onClick={() => setNewItem(p => ({ ...p, quantity: p.quantity + 1 }))} className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100"><Plus size={14} /></button>
                                    </div>
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <span className="pl-4 text-sm font-black text-slate-400 shrink-0">{currencySymbol}</span>
                                        <input type="number" placeholder="0" value={newItem.price || ''} onChange={e => setNewItem(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="flex-1 pl-2 pr-4 bg-transparent text-sm font-black text-slate-900 outline-none" />
                                    </div>
                                </div>
                                <button type="button" onClick={addEditItem}
                                    className="w-full h-12 bg-violet-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-violet-500/25">
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            {/* Items list */}
                            {editItems.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Items ({editItems.length})</p>
                                    {editItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
                                            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                                <Package size={14} className="text-violet-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate">{item.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{item.quantity} × {currencySymbol}{Number(item.price).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <p className="text-sm font-black text-slate-900">{currencySymbol}{item.total.toLocaleString()}</p>
                                                <button onClick={() => setEditItems(prev => prev.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 active:scale-90"><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Notes</p>
                                <textarea placeholder="Conditions, due date, guarantees..." value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-500 resize-none transition-all" />
                            </div>
                        </div>

                        <div className="px-5 pt-3 pb-8 border-t border-slate-200/60 bg-slate-100 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                                <span className="text-xl font-black text-slate-900 tabular-nums">{currencySymbol}{editItems.reduce((s, i) => s + i.total, 0).toLocaleString()}</span>
                            </div>
                            <button onClick={handleUpdate} disabled={isUpdating || editItems.length === 0}
                                className="w-full h-14 bg-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-violet-500/30 disabled:opacity-40">
                                {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <><Check size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Inline "New Credit" button that opens a sheet ──
function CreateDebtorInline({ currencySymbol }: { currencySymbol: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [debtDate, setDebtDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<DebtorItem[]>([]);
    const [currentItem, setCurrentItem] = useState<DebtorItem>({ productName: '', quantity: 1, price: 0, total: 0 });
    const [notes, setNotes] = useState('');

    const addItem = () => {
        if (!currentItem.productName.trim() || currentItem.quantity <= 0 || currentItem.price <= 0) { toast.error('Fill all item fields'); return; }
        setItems(prev => [...prev, { ...currentItem, total: currentItem.quantity * currentItem.price }]);
        setCurrentItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };

    const totalAmount = items.reduce((s, i) => s + i.total, 0);

    const handleSubmit = async () => {
        if (!clientName.trim()) { toast.error('Client name required'); return; }
        if (items.length === 0) { toast.error('Add at least one item'); return; }
        setIsLoading(true);
        const res = await createDebtor({ name: clientName, phone: clientPhone, amount: totalAmount, notes, debtDate, items });
        setIsLoading(false);
        if (res.success) {
            toast.success('Credit registered');
            setClientName(''); setClientPhone(''); setDebtDate(new Date().toISOString().split('T')[0]); setItems([]); setNotes('');
            setCurrentItem({ productName: '', quantity: 1, price: 0, total: 0 });
            setOpen(false);
            window.location.reload();
        } else toast.error(res.error || 'Failed');
    };

    return (
        <>
            <button onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-violet-500/40 active:scale-95 transition-all">
                <Plus size={16} strokeWidth={3} /> New Credit
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative bg-slate-100 rounded-t-[2.5rem] max-h-[94dvh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.3)] overflow-hidden">
                        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-300 rounded-full" /></div>

                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                    <Wallet size={18} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-slate-900 leading-none">New Credit</h2>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Debt Registry</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95"><X size={16} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Client</p>
                                <input type="text" placeholder="Client name..." value={clientName} onChange={e => setClientName(e.target.value)}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 transition-all" />
                                <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="pl-4 pr-2"><Phone size={15} className="text-slate-400" /></div>
                                    <input type="tel" placeholder="Phone (optional)..." value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                                        className="flex-1 pr-4 bg-transparent text-sm font-medium text-slate-900 outline-none" />
                                </div>
                                <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="pl-4 pr-2"><Calendar size={15} className="text-slate-400" /></div>
                                    <input type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)}
                                        className="flex-1 pr-4 bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer" />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Add Item</p>
                                <input type="text" placeholder="Article description..." value={currentItem.productName} onChange={e => setCurrentItem(p => ({ ...p, productName: e.target.value }))}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 transition-all" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <button type="button" onClick={() => setCurrentItem(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))} className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100"><Minus size={14} /></button>
                                        <input type="number" value={currentItem.quantity} onChange={e => setCurrentItem(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className="flex-1 bg-transparent text-center text-sm font-black text-slate-900 outline-none" />
                                        <button type="button" onClick={() => setCurrentItem(p => ({ ...p, quantity: p.quantity + 1 }))} className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100"><Plus size={14} /></button>
                                    </div>
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <span className="pl-4 text-sm font-black text-slate-400 shrink-0">{currencySymbol}</span>
                                        <input type="number" placeholder="0" value={currentItem.price || ''} onChange={e => setCurrentItem(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="flex-1 pl-2 pr-4 bg-transparent text-sm font-black text-slate-900 outline-none" />
                                    </div>
                                </div>
                                <button type="button" onClick={addItem} className="w-full h-12 bg-violet-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-violet-500/25">
                                    <Plus size={16} /> Add to Credit
                                </button>
                            </div>

                            {items.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Items ({items.length})</p>
                                        <button onClick={() => setItems([])} className="text-[9px] font-bold text-rose-500">Clear all</button>
                                    </div>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
                                            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><Package size={14} className="text-violet-600" /></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate">{item.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{item.quantity} × {currencySymbol}{item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <p className="text-sm font-black text-slate-900">{currencySymbol}{item.total.toFixed(2)}</p>
                                                <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 active:scale-90"><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Notes (optional)</p>
                                <textarea placeholder="Due date, conditions, collateral..." value={notes} onChange={e => setNotes(e.target.value)}
                                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-500 resize-none transition-all" />
                            </div>
                        </div>

                        <div className="px-5 pt-3 pb-8 border-t border-slate-200/60 bg-slate-100 shrink-0">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Credit</span>
                                <span className="text-xl font-black text-slate-900 tabular-nums">{currencySymbol}{totalAmount.toLocaleString()}</span>
                            </div>
                            <button onClick={handleSubmit} disabled={isLoading || items.length === 0 || !clientName.trim()}
                                className="w-full h-14 bg-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-violet-500/30 disabled:opacity-40">
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Register Credit</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
