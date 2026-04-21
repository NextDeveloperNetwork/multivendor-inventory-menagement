'use client';

import React, { useState } from 'react';
import {
    Package, Clock, Trash2, Edit3, X, Plus, Minus,
    FileText, Send, Loader2, Search, SlidersHorizontal,
    TrendingUp, ShoppingBag, Sparkles, ChevronDown, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteFreeSale, updateFreeSale } from '@/app/actions/salesOps';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import CreateFreeSaleForm from './CreateFreeSaleForm';

interface SaleItem {
    id?: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

interface Sale {
    id: string;
    totalAmount: number;
    soldBy: string;
    notes: string | null;
    createdAt: string | Date;
    items: SaleItem[];
}

interface FreeSalesClientProps {
    initialSales: any[];
    userName: string;
    currencySymbol?: string;
}

const PERIODS = [
    { label: 'Today', getDates: () => { const t = new Date().toISOString().split('T')[0]; return [t, t]; } },
    { label: 'Week', getDates: () => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - 6); return [start.toISOString().split('T')[0], now.toISOString().split('T')[0]]; } },
    { label: 'Month', getDates: () => { const now = new Date(); return [new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]]; } },
    { label: 'All', getDates: () => ['', ''] },
];

export default function FreeSalesClient({ initialSales, userName, currencySymbol = '$' }: FreeSalesClientProps) {
    const [sales, setSales] = useState<Sale[]>(initialSales);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activePeriod, setActivePeriod] = useState('Month');

    // Date Filtering
    const now = new Date();
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);

    // Edit sheet state
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [editItems, setEditItems] = useState<SaleItem[]>([]);
    const [editNotes, setEditNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [newItem, setNewItem] = useState<SaleItem>({ productName: '', quantity: 1, price: 0, total: 0 });

    const filteredSales = sales.filter((sale) => {
        const dDate = new Date(sale.createdAt).toISOString().split('T')[0];
        const matchesDate = (!startDate || dDate >= startDate) && (!endDate || dDate <= endDate);
        const matchesSearch = !searchQuery ||
            sale.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesDate && matchesSearch;
    });

    const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const totalQty = filteredSales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);

    const applyPeriod = (label: string) => {
        const period = PERIODS.find(p => p.label === label);
        if (!period) return;
        const [s, e] = period.getDates();
        setStartDate(s);
        setEndDate(e);
        setActivePeriod(label);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this sale permanently?')) return;
        setIsProcessing(id);
        const res = await deleteFreeSale(id);
        setIsProcessing(null);
        if (res.success) {
            toast.success('Sale deleted');
            setSales(sales.filter(s => s.id !== id));
        } else {
            toast.error(res.error || 'Failed to delete');
        }
    };

    const handleEditInitiate = (sale: Sale) => {
        setEditingSale(sale);
        setEditItems([...sale.items]);
        setEditNotes(sale.notes || '');
        setNewItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };

    const addEditItem = () => {
        if (!newItem.productName.trim() || newItem.quantity <= 0 || newItem.price <= 0) {
            toast.error('Fill in all item fields');
            return;
        }
        setEditItems([...editItems, { ...newItem, total: newItem.quantity * newItem.price }]);
        setNewItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };

    const removeEditItem = (index: number) => {
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    const handleUpdate = async () => {
        if (!editingSale || editItems.length === 0) { toast.error('Add at least one item'); return; }
        setIsUpdating(true);
        const totalAmount = editItems.reduce((sum, i) => sum + i.total, 0);
        const res = await updateFreeSale(editingSale.id, { items: editItems, totalAmount, notes: editNotes });
        setIsUpdating(false);
        if (res.success) {
            toast.success('Sale updated');
            setSales(sales.map(s => s.id === editingSale.id ? { ...s, items: editItems, totalAmount, notes: editNotes } : s));
            setEditingSale(null);
        } else {
            toast.error(res.error || 'Update failed');
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-slate-950">

            {/* ── DARK HERO HEADER ── */}
            <div className="relative overflow-hidden px-5 pt-6 pb-8">
                {/* Background glows */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -mr-36 -mt-36 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/8 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-[0.3em] mb-1">Sales Hub</p>
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Free <span className="text-emerald-400">Sales</span>
                            </h1>
                        </div>
                        <CreateFreeSaleForm userName={userName} currencySymbol={currencySymbol} />
                    </div>

                    {/* Stat pills */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <TrendingUp size={12} className="text-emerald-400" />
                                </div>
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Revenue</span>
                            </div>
                            <p className="text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                                {currencySymbol}<span className="text-emerald-400">{totalRevenue.toLocaleString()}</span>
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center">
                                    <ShoppingBag size={12} className="text-sky-400" />
                                </div>
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Units</span>
                            </div>
                            <p className="text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                                <span className="text-sky-400">{totalQty}</span> <span className="text-sm text-white/30 font-bold">sold</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ── */}
            <div className="bg-slate-950 px-5 pb-4 space-y-3">
                {/* Period chips */}
                <div className="flex gap-2">
                    {PERIODS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPeriod(p.label)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                                activePeriod === p.label
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                    : "bg-white/5 text-white/50 border border-white/10"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "w-11 rounded-xl flex items-center justify-center transition-all active:scale-95 border",
                            showFilters ? "bg-emerald-500 text-white border-emerald-500" : "bg-white/5 text-white/50 border-white/10"
                        )}
                    >
                        <SlidersHorizontal size={14} />
                    </button>
                </div>

                {/* Extended filters */}
                {showFilters && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">From</label>
                                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePeriod(''); }}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[11px] font-bold text-white outline-none focus:border-emerald-500 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">To</label>
                                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePeriod(''); }}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[11px] font-bold text-white outline-none focus:border-emerald-500 transition-all" />
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                            <input
                                type="text"
                                placeholder="Search products or notes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-[11px] font-medium text-white outline-none focus:border-emerald-500 transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── SALES LIST ── */}
            <div className="flex-1 bg-slate-100 rounded-t-[2rem] px-4 pt-5 pb-36 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filteredSales.length} records</span>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                            <X size={10} /> Clear
                        </button>
                    )}
                </div>

                {filteredSales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                            <Sparkles size={28} className="text-slate-200" />
                        </div>
                        <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">No Records Found</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1.5 max-w-[200px] leading-relaxed">
                            Adjust the period filter or register a new sale.
                        </p>
                    </div>
                ) : filteredSales.map((sale) => (
                    <div key={sale.id} className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100/80 active:scale-[0.99] transition-transform">
                        {/* Top accent bar */}
                        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

                        <div className="p-4">
                            {/* Row 1: id + date + amount */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <Package size={16} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">#{sale.id.slice(-6).toUpperCase()}</p>
                                        <div className="flex items-center gap-1">
                                            <Clock size={9} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500">
                                                {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-slate-900 tabular-nums tracking-tight leading-none">
                                        {currencySymbol}{Number(sale.totalAmount).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] font-bold text-emerald-600 mt-0.5">{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Item chips */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {sale.items.map((item, idx) => (
                                    <span key={idx} className="text-[9px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                        {item.quantity}× {item.productName}
                                    </span>
                                ))}
                            </div>

                            {/* Notes (if any) */}
                            {sale.notes && (
                                <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2 mb-3 border border-slate-100">
                                    <FileText size={11} className="text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic">{sale.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditInitiate(sale)}
                                    className="flex-1 h-11 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100"
                                >
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(sale.id)}
                                    disabled={isProcessing === sale.id}
                                    className="w-11 h-11 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 disabled:opacity-40"
                                >
                                    {isProcessing === sale.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─────── EDIT BOTTOM SHEET ─────── */}
            <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none w-full m-0 fixed bottom-0 top-auto translate-y-0 rounded-none data-[state=open]:animate-none">
                    <div className="bg-slate-100 rounded-t-[2.5rem] max-h-[92dvh] flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Edit Sale Record</DialogTitle>
                            <DialogDescription>Modify items and notes for this sale.</DialogDescription>
                        </DialogHeader>

                        {/* Sheet handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-300 rounded-full" />
                        </div>

                        {/* Sheet header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
                            <div>
                                <h2 className="text-base font-black text-slate-900 uppercase italic tracking-tight leading-none">Edit Sale</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{editingSale?.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button
                                onClick={() => setEditingSale(null)}
                                className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                            {/* Add item section */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Add Item</p>
                                <input
                                    type="text"
                                    placeholder="Product name..."
                                    value={newItem.productName}
                                    onChange={e => setNewItem({ ...newItem, productName: e.target.value })}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Qty */}
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <button type="button" onClick={() => setNewItem({ ...newItem, quantity: Math.max(1, newItem.quantity - 1) })}
                                            className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100">
                                            <Minus size={14} />
                                        </button>
                                        <input type="number" value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                            className="flex-1 bg-transparent text-center text-sm font-black text-slate-900 outline-none" />
                                        <button type="button" onClick={() => setNewItem({ ...newItem, quantity: newItem.quantity + 1 })}
                                            className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    {/* Price */}
                                    <div className="relative flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <span className="pl-4 text-sm font-black text-slate-400">{currencySymbol}</span>
                                        <input type="number" placeholder="0" value={newItem.price || ''}
                                            onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                            className="flex-1 pl-2 pr-4 bg-transparent text-sm font-black text-slate-900 outline-none" />
                                    </div>
                                </div>
                                <button type="button" onClick={addEditItem}
                                    className="w-full h-12 bg-emerald-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 hover:bg-emerald-600">
                                    <Plus size={16} /> Add to Sale
                                </button>
                            </div>

                            {/* Current items */}
                            {editItems.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Items ({editItems.length})</p>
                                    {editItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                                <Package size={14} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate">{item.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{item.quantity} × {currencySymbol}{Number(item.price).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <p className="text-sm font-black text-slate-900">{currencySymbol}{item.total.toLocaleString()}</p>
                                                <button onClick={() => removeEditItem(idx)} className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 active:scale-90">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Notes</p>
                                <textarea
                                    placeholder="Optional notes or context..."
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 pt-3 pb-8 border-t border-slate-200/60 bg-slate-100 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                                <span className="text-xl font-black text-slate-900 tabular-nums">
                                    {currencySymbol}{editItems.reduce((s, i) => s + i.total, 0).toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating || editItems.length === 0}
                                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-40 hover:bg-emerald-600"
                            >
                                {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <><Check size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
