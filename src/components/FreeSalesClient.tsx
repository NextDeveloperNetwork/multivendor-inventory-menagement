'use client';

import React, { useState, useMemo } from 'react';
import { Banknote, Package, Clock, User, ChevronLeft, ChevronRight, FileText, Search, Trash2, ShoppingBag, Filter, LayoutList, ListOrdered, Edit3, X, Plus, Minus, Send, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { deleteFreeSale, updateFreeSale } from '@/app/actions/salesOps';

interface FreeSalesClientProps {
    initialSales: any[];
}

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function FreeSalesClient({ initialSales }: FreeSalesClientProps) {
    const [sales, setSales] = useState<any[]>(initialSales);
    const [viewType, setViewType] = useState<'invoice' | 'article'>('article');
    const [period, setPeriod] = useState<Period>('today');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    
    // Editing state
    const [editingSale, setEditingSale] = useState<any | null>(null);
    const [editItems, setEditItems] = useState<any[]>([]);
    const [editNotes, setEditNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Period Logic - using getTime() for stable comparisons
    const dateRange = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (period === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'yesterday') {
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - 1);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            start.setMonth(now.getMonth() - 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'custom' && customRange.start && customRange.end) {
            const cStart = new Date(customRange.start);
            const cEnd = new Date(customRange.end);
            cStart.setHours(0, 0, 0, 0);
            cEnd.setHours(23, 59, 59, 999);
            return {
                start: cStart.getTime(),
                end: cEnd.getTime()
            };
        }

        return { start: start.getTime(), end: end.getTime() };
    }, [period, customRange]);

    // Filtered Content
    const filteredSales = useMemo(() => {
        return sales.filter((sale: any) => {
            const saleTime = new Date(sale.createdAt).getTime();
            const matchesPeriod = saleTime >= dateRange.start && saleTime <= dateRange.end;
            const matchesSearch = !searchQuery || 
                sale.items.some((i: any) => i.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sale.soldBy.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesPeriod && matchesSearch;
        });
    }, [sales, dateRange, searchQuery]);

    const filteredItems = useMemo(() => {
        return filteredSales.flatMap(sale => 
            sale.items.map((item: any) => ({
                ...item,
                saleId: sale.id,
                soldBy: sale.soldBy,
                createdAt: sale.createdAt,
                notes: sale.notes
            }))
        ).filter(item => !searchQuery || item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [filteredSales, searchQuery]);

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + Number(sale.totalAmount), 0);
    const totalQty = filteredItems.reduce((acc, item) => acc + item.quantity, 0);

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Free Sales Report (${period.toUpperCase()})`, 14, 22);
        
        autoTable(doc, {
            startY: 40,
            head: [['Article', 'Qty', 'Unit Price', 'Total', 'Sold By', 'Date']],
            body: filteredItems.map(i => [
                i.productName, 
                i.quantity, 
                `$${Number(i.price).toLocaleString()}`, 
                `$${Number(i.total).toLocaleString()}`, 
                i.soldBy, 
                new Date(i.createdAt).toLocaleDateString()
            ]),
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        });
        doc.save(`FreeSales_${period}_Export.pdf`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this entire transaction?')) return;
        setIsDeleting(id);
        const res = await deleteFreeSale(id);
        setIsDeleting(null);
        if (res.success) {
            toast.success('Sale deleted');
            setSales(sales.filter(s => s.id !== id));
        }
    };

    const startEditing = (sale: any) => {
        setEditingSale(sale);
        setEditItems([...sale.items]);
        setEditNotes(sale.notes || '');
    };

    const handleUpdate = async () => {
        if (editItems.length === 0) return toast.error('Add at least one item');
        setIsUpdating(true);
        const total = editItems.reduce((sum, i) => sum + Number(i.total), 0);
        const res = await updateFreeSale(editingSale.id, {
            items: editItems,
            totalAmount: total,
            notes: editNotes
        });
        setIsUpdating(false);
        if (res.success) {
            toast.success('Sale updated');
            setEditingSale(null);
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 shrink-0">
                        <ShoppingBag size={32} className="md:w-10 md:h-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight italic uppercase tracking-tighter">Sales Performance</h1>
                        <p className="text-[10px] md:text-sm text-slate-400 font-bold tracking-widest uppercase mt-1 opacity-70">Strategic Audit Consolidation</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex items-center shadow-inner">
                        {(['today', 'yesterday', 'week', 'month', 'custom'] as Period[]).map((p) => (
                            <button 
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    period === p ? "bg-white border border-slate-200 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                            <input 
                                type="date" 
                                value={customRange.start}
                                onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
                                className="bg-transparent border-none text-[10px] font-black text-slate-900 outline-none w-28 uppercase p-0"
                            />
                            <span className="text-slate-300 font-bold">→</span>
                            <input 
                                type="date" 
                                value={customRange.end}
                                onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
                                className="bg-transparent border-none text-[10px] font-black text-slate-900 outline-none w-28 uppercase p-0"
                            />
                        </div>
                    )}

                    <button onClick={generatePDF} className="h-12 px-8 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                        <FileText size={18} /> Export Data
                    </button>
                </div>
            </div>

            {/* View Switcher & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center w-fit shadow-sm">
                    <button 
                        onClick={() => setViewType('invoice')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewType === 'invoice' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <LayoutList size={14} /> Transactions
                    </button>
                    <button 
                        onClick={() => setViewType('article')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewType === 'article' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <ListOrdered size={14} /> Line Items
                    </button>
                </div>

                <div className="flex-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative flex items-center">
                    <Search className="absolute left-6 text-slate-300" size={20} />
                    <input 
                        type="text"
                        placeholder="Scan entries by article name or salesperson..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-transparent text-[11px] font-bold uppercase tracking-widest outline-none text-slate-900 placeholder:text-slate-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
                {/* Scorecards */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Period Revenue</p>
                            <p className="text-4xl font-black italic tabular-nums text-slate-900 tracking-tighter">${totalRevenue.toLocaleString()}</p>
                            <div className="mt-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Live Auditor View</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2 italic">Volume Dispensed</p>
                            <p className="text-4xl font-black italic tabular-nums tracking-tighter">{totalQty.toLocaleString()}</p>
                            <p className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest mt-6 opacity-60">Total units across all items</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {viewType === 'article' ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article / Description</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Batch Qty</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredItems.map((item, idx) => (
                                            <tr key={`${item.saleId}-${idx}`} className="group hover:bg-slate-50/50 transition-all font-medium">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                                            <Package size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{item.productName}</p>
                                                            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase">
                                                                <User size={10} className="text-emerald-400" /> {item.soldBy}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="inline-flex h-8 px-3 rounded-lg bg-slate-900 text-white text-[11px] font-black items-center tabular-nums">{item.quantity}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <p className="text-lg font-black text-slate-900 tabular-nums italic">${Number(item.total).toLocaleString()}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">@ ${Number(item.price).toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase" suppressHydrationWarning>
                                                        <Calendar size={12} className="text-slate-300" /> {new Date(item.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase mt-1" suppressHydrationWarning>
                                                        <Clock size={12} className="text-slate-200" /> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => startEditing(sales.find(s => s.id === item.saleId))}
                                                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:shadow-lg rounded-xl transition-all"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.saleId)}
                                                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:shadow-lg rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredSales.map((sale: any) => (
                                <div key={sale.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-8 hover:shadow-2xl hover:border-emerald-100 transition-all group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest">ORD-{sale.id.slice(-6).toUpperCase()}</span>
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest">Verified Log</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sale.items.map((i: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm"><Package size={14} /></div>
                                                    <p className="text-[11px] font-black text-slate-800 uppercase italic truncate">{i.productName} <span className="text-emerald-500">×{i.quantity}</span></p>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Metadata for Invoice View */}
                                        <div className="flex items-center gap-5 mt-8 pt-6 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><User size={12} className="text-emerald-500" /> {sale.soldBy || 'Manager'}</span>
                                            <span className="flex items-center gap-2" suppressHydrationWarning>
                                                <Calendar size={12} className="text-slate-300" /> {new Date(sale.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-2" suppressHydrationWarning>
                                                <Clock size={12} className="text-slate-300" /> {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 xl:pl-8 xl:border-l xl:border-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">Total Disbursement</p>
                                        <p className="text-4xl font-black text-slate-900 italic tabular-nums leading-none tracking-tighter mb-8">${Number(sale.totalAmount).toLocaleString()}</p>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => startEditing(sale)}
                                                className="h-12 px-6 bg-slate-50 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-100 transition-all flex items-center gap-2"
                                            >
                                                <Edit3 size={16} /> Manage
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(sale.id)}
                                                className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl border border-rose-100 transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal (Same as before but refined) */}
            {editingSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setEditingSale(null)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Adjust Order Log</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live Revision Mode</p>
                            </div>
                            <button onClick={() => setEditingSale(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-6">
                            {editItems.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 relative group">
                                    <button 
                                        onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                                        className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-slate-200 text-rose-500 rounded-2xl flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</label>
                                        <input 
                                            type="text"
                                            value={item.productName}
                                            onChange={e => {
                                                const newItems = [...editItems];
                                                newItems[idx].productName = e.target.value;
                                                setEditItems(newItems);
                                            }}
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 text-xs font-black text-slate-900 outline-none uppercase italic focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                                                <button onClick={() => {
                                                    const newItems = [...editItems];
                                                    newItems[idx].quantity = Math.max(1, newItems[idx].quantity - 1);
                                                    newItems[idx].total = newItems[idx].quantity * newItems[idx].price;
                                                    setEditItems(newItems);
                                                }} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Minus size={16} /></button>
                                                <input readOnly value={item.quantity} className="flex-1 text-center font-black text-base text-slate-900" />
                                                <button onClick={() => {
                                                    const newItems = [...editItems];
                                                    newItems[idx].quantity += 1;
                                                    newItems[idx].total = newItems[idx].quantity * newItems[idx].price;
                                                    setEditItems(newItems);
                                                }} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Plus size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retail Price</label>
                                            <input 
                                                type="number"
                                                value={item.price}
                                                onChange={e => {
                                                    const newItems = [...editItems];
                                                    newItems[idx].price = Number(e.target.value);
                                                    newItems[idx].total = newItems[idx].quantity * newItems[idx].price;
                                                    setEditItems(newItems);
                                                }}
                                                className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 text-sm font-black text-slate-900 outline-none focus:border-emerald-400 shadow-sm transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={() => setEditItems([...editItems, { productName: 'New Item', quantity: 1, price: 0, total: 0 }])}
                                className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-[11px] font-black uppercase text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-3"
                            >
                                <Plus size={20} /> Append New Article
                            </button>
                        </div>

                        <div className="p-10 bg-slate-900 rounded-b-[3rem] shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Updated Transaction Total</p>
                                <p className="text-4xl font-black italic tabular-nums text-white tracking-tighter">${editItems.reduce((sum, i) => sum + Number(i.total), 0).toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98] transition-all"
                            >
                                {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Finalize Updates</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
