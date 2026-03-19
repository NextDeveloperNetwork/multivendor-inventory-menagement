'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createInvoice } from '@/app/actions/invoice';
import {
    Plus, Trash2, FileText, Calendar, Search,
    Package, Store, Eye, ChevronDown, Activity,
    X, MapPin, Hash,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import InvoiceDetailsDialog from './InvoiceDetailsDialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import DeleteInvoiceButton from './DeleteInvoiceButton';
import QuickAddSupplierDialog from './QuickAddSupplierDialog';

interface InvoiceClientProps {
    invoices: any[];
    products: any[];
    suppliers: any[];
    warehouses: any[];
    shops: any[];
    currency: { symbol: string; rate: number; code?: string };
    selectedBusinessId: string | null;
}

type LineItem = { productId: string; productName: string; quantity: string; cost: string };

const emptyItem = (): LineItem => ({ productId: '', productName: '', quantity: '', cost: '' });

export default function InvoiceClient({
    invoices, products, suppliers, warehouses, shops, currency, selectedBusinessId,
}: InvoiceClientProps) {
    const symbol = currency?.symbol || '$';
    const router = useRouter();
    const searchParams = useSearchParams();

    // Dialog
    const [open, setOpen] = useState(false);

    // Header fields
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [destinationType, setDestinationType] = useState<'warehouse' | 'shop'>('warehouse');
    const [warehouseId, setWarehouseId] = useState('');
    const [shopId, setShopId] = useState('');

    // Line items
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);
    const [loading, setLoading] = useState(false);

    // URL filters
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const updateFilters = (field: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(field, value); else params.delete(field);
        router.push(`/admin/invoices?${params.toString()}`);
    };

    const resetForm = () => {
        setInvoiceNumber('');
        setSupplierId('');
        setWarehouseId('');
        setShopId('');
        setDestinationType('warehouse');
        setItems([emptyItem()]);
    };

    const addRow = () => setItems(prev => [...prev, emptyItem()]);
    const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const updateItemField = (index: number, field: keyof LineItem, value: string) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleProductNameChange = (index: number, val: string) => {
        const matched = products.find(p => p.name.toLowerCase() === val.toLowerCase());
        setItems(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                productName: val,
                productId: matched ? matched.id : '',
                cost: matched && !next[index].cost ? (matched.cost?.toString() || '') : next[index].cost,
            };
            return next;
        });
    };

    const totalValue = items.reduce((sum, item) => {
        return sum + (parseFloat(item.cost) || 0) * (parseInt(item.quantity) || 0);
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const validItems = items.filter(i => i.productId && i.quantity && i.cost);
        if (validItems.length === 0) {
            toast.error('Please add at least one valid article.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('number', invoiceNumber);
        formData.append('supplierId', supplierId);
        if (destinationType === 'warehouse') formData.append('warehouseId', warehouseId);
        else formData.append('shopId', shopId);
        if (selectedBusinessId) formData.append('businessId', selectedBusinessId);
        formData.append('items', JSON.stringify(validItems));

        const result = await createInvoice(formData);
        if (result.success) {
            toast.success('Invoice created successfully');
            resetForm();
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50">
            {/* product datalist for autocomplete */}
            <datalist id="inv-products">
                {products.map(p => <option key={p.id} value={p.name} />)}
            </datalist>

            {/* ── Top Toolbar ── */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-white border-b border-slate-300">
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-blue-500/10"
                    >
                        <Plus size={16} strokeWidth={3} />
                        New Entry
                    </button>

                    <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 h-10">
                        <Calendar size={14} className="text-slate-500" />
                        <div className="flex items-center gap-1">
                            <input
                                type="date" value={startDate}
                                onChange={e => updateFilters('startDate', e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none w-[105px]"
                            />
                            <span className="text-slate-400 text-[10px] font-bold">TO</span>
                            <input
                                type="date" value={endDate}
                                onChange={e => updateFilters('endDate', e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none w-[105px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative group w-full lg:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search manifest by number..."
                        defaultValue={searchParams.get('q') || ''}
                        className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-900"
                        onKeyDown={e => {
                            if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                        }}
                    />
                </div>
            </div>

            {/* ── Stats Mini-Bar ── */}
            <div className="bg-slate-50/80 border-b border-slate-200 flex items-center gap-6 px-6 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{invoices.length} Entries Recorded</span>
                </div>
            </div>

            {/* ── Main Table Content ── */}
            <div className="flex-1 overflow-auto bg-white">
                {invoices.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto">
                            <FileText className="text-slate-300" size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No matching records found</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 italic">Clear filters or create a new manifest</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block min-w-[1000px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-slate-300">
                                        <TableHead className="w-[180px] py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-700">Identity</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Timeline</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Origin / Source</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Payload</TableHead>
                                        <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-700">Net Valuation</TableHead>
                                        <TableHead className="w-[120px] py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-700">Control</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map(invoice => {
                                         const subTotalValue = invoice.items.reduce((s: number, i: any) => s + Number(i.cost) * i.quantity, 0);
                                         return (
                                             <InvoiceDetailsDialog key={invoice.id} invoice={invoice} currency={currency}>
                                                 <TableRow className="group cursor-pointer hover:bg-blue-50 transition-all border-b border-slate-200 last:border-0 h-16">
                                                     <TableCell className="px-6">
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                                 <Hash size={14} />
                                                             </div>
                                                             <div>
                                                                 <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{invoice.number}</div>
                                                                 <div className="text-[9px] text-slate-500 font-bold font-mono tracking-tighter uppercase">Manifest ID</div>
                                                             </div>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell>
                                                         <div className="flex flex-col">
                                                             <span className="font-bold text-slate-800 text-xs">
                                                                 {new Date(invoice.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                             </span>
                                                             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Recorded</span>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell>
                                                         <div className="flex items-center gap-2">
                                                             <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:border-blue-400 transition-colors">
                                                                 <Store size={12} />
                                                             </div>
                                                             <div className="flex flex-col">
                                                                 <span className="font-bold text-slate-900 text-xs">{invoice.supplier?.name || 'GENERIC SOURCE'}</span>
                                                                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight line-clamp-1">{invoice.supplier?.email || 'OFFLINE DATA'}</span>
                                                             </div>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell>
                                                         <div className="flex items-center gap-2">
                                                             <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200 shadow-sm">
                                                                 <Package size={11} className="mr-1.5" />
                                                                 <span className="text-[10px] font-black uppercase tracking-tighter">{invoice.items.length} Units</span>
                                                             </div>
                                                             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aggregated</span>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell className="text-right">
                                                         <div className="flex flex-col items-end">
                                                             <span className="font-black text-slate-900 font-mono text-sm tracking-tight">
                                                                 {formatCurrency(subTotalValue, symbol)}
                                                             </span>
                                                             <div className="flex items-center gap-1">
                                                                 <div className={`w-1 h-1 rounded-full ${subTotalValue > 1000 ? 'bg-emerald-600' : 'bg-blue-600'}`} />
                                                                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Validated</span>
                                                             </div>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell className="px-6 text-right">
                                                         <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                                             <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
                                                                 <Eye size={16} />
                                                             </div>
                                                             <DeleteInvoiceButton id={invoice.id} />
                                                         </div>
                                                     </TableCell>
                                                 </TableRow>
                                             </InvoiceDetailsDialog>
                                         );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile List View */}
                        <div className="grid grid-cols-1 gap-3 md:hidden p-3 bg-slate-100">
                            {invoices.map(invoice => {
                                const subTotalValue = invoice.items.reduce((s: number, i: any) => s + Number(i.cost) * i.quantity, 0);
                                return (
                                    <InvoiceDetailsDialog key={invoice.id} invoice={invoice} currency={currency}>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-sm space-y-3 active:scale-[0.98] transition-all group border-l-4 border-l-blue-600">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-blue-600 border border-slate-200">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-sm tracking-tight uppercase">#{invoice.number}</div>
                                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(invoice.date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-black text-slate-900 text-sm">
                                                        {formatCurrency(subTotalValue, symbol)}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Value</div>
                                                </div>
                                            </div>
                                            
                                            <div className="h-[1px] bg-slate-200 w-full" />
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Origin</span>
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{invoice.supplier?.name || 'GENERIC SOURCE'}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Payload</span>
                                                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                                        <Package size={10} /> {invoice.items.length} Items
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                <DeleteInvoiceButton id={invoice.id} />
                                            </div>
                                        </div>
                                    </InvoiceDetailsDialog>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ── Create Invoice Dialog ── */}
            <Dialog open={open} onOpenChange={open => { setOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 rounded-3xl overflow-hidden border-none shadow-2xl max-h-[92vh] flex flex-col">
                    {/* Header */}
                    <DialogHeader className="bg-slate-900 px-8 py-6 flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <FileText size={20} className="text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-white font-bold text-lg tracking-tight">
                                    New Entry Manifest
                                </DialogTitle>
                                <p className="text-slate-300 text-xs mt-0.5 uppercase tracking-[0.1em] font-bold">Synchronize Inbound Resource Data</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setOpen(false); resetForm(); }}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1 bg-white">
                        {/* ── Info Row ── */}
                        <div className="bg-slate-100 border-b border-slate-300 px-8 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 shadow-inner">
                            {/* Invoice # */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1">
                                    <Hash size={10} /> Manifest ID
                                </label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-XXX"
                                    className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all uppercase placeholder:text-slate-400"
                                />
                            </div>

                            {/* Supplier */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center justify-between mb-1">
                                    <span className="flex items-center gap-1.5"><Store size={10} /> Origin Source</span>
                                    <QuickAddSupplierDialog onAdd={s => { setSupplierId(s.id); router.refresh(); }} />
                                </label>
                                <div className="relative">
                                    <select
                                        value={supplierId}
                                        onChange={e => setSupplierId(e.target.value)}
                                        required
                                        className="w-full h-11 pl-4 pr-10 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all appearance-none"
                                    >
                                        <option value="">Select source…</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Destination type toggle */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1">
                                    <MapPin size={10} /> Endpoint Type
                                </label>
                                <div className="flex h-11 p-1 bg-white border border-slate-300 rounded-xl gap-1">
                                    {(['warehouse', 'shop'] as const).map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => setDestinationType(t)}
                                            className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${destinationType === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Destination selector */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 block">
                                    Target {destinationType === 'warehouse' ? 'Repository' : 'Location'}
                                </label>
                                <div className="relative">
                                    {destinationType === 'warehouse' ? (
                                        <select
                                            value={warehouseId}
                                            onChange={e => setWarehouseId(e.target.value)}
                                            required
                                            className="w-full h-11 pl-4 pr-10 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all appearance-none"
                                        >
                                            <option value="">Select repository…</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    ) : (
                                        <select
                                            value={shopId}
                                            onChange={e => setShopId(e.target.value)}
                                            required
                                            className="w-full h-11 pl-4 pr-10 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all appearance-none"
                                        >
                                            <option value="">Select location…</option>
                                            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    )}
                                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* ── Articles Table ── */}
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
                                        Resource Payload — {items.filter(i => i.productId).length} Matched
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 lg:hover:bg-blue-600 text-blue-700 lg:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                >
                                    <Plus size={14} strokeWidth={3} /> Append Block
                                </button>
                            </div>

                            {/* Excel-style grid */}
                            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_100px_130px_130px_48px] bg-slate-100 border-b border-slate-300 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
                                    <div className="px-5 py-3">Resource / Identifier</div>
                                    <div className="px-4 py-3 text-center border-l border-slate-300/50">Volume</div>
                                    <div className="px-4 py-3 text-right border-l border-slate-300/50">Unit Val.</div>
                                    <div className="px-5 py-3 text-right border-l border-slate-300/50">Aggregated</div>
                                    <div className="border-l border-slate-300/50" />
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-slate-200">
                                    {items.map((item, index) => {
                                        const matched = products.find(p => p.id === item.productId);
                                        const subtotal = (parseFloat(item.cost) || 0) * (parseInt(item.quantity) || 0);
                                        const rowIsValid = !!item.productId;

                                        return (
                                            <div
                                                key={index}
                                                className={`grid grid-cols-[1fr_100px_130px_130px_48px] items-stretch transition-colors ${rowIsValid ? 'bg-white' : 'bg-slate-100/50'}`}
                                            >
                                                {/* Product name */}
                                                <div className="px-4 py-3 flex flex-col justify-center border-r border-transparent focus-within:border-blue-300 focus-within:bg-blue-50 transition-all">
                                                    <input
                                                        type="text"
                                                        list="inv-products"
                                                        value={item.productName}
                                                        onChange={e => handleProductNameChange(index, e.target.value)}
                                                        placeholder="Scan or type identifier…"
                                                        className="w-full h-8 px-2 bg-transparent border-none text-xs text-slate-900 font-black outline-none placeholder:text-slate-400 uppercase tracking-tight"
                                                        required
                                                    />
                                                    {matched && (
                                                        <div className="flex items-center gap-2 mt-0.5 px-2">
                                                            <span className="text-[9px] text-blue-700 font-black tracking-widest font-mono uppercase bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                                                SKU: {matched.sku}
                                                            </span>
                                                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter italic">Stock: {matched.totalStock || 0}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Volume */}
                                                <div className="px-2 py-3 border-l border-slate-200 flex items-center justify-center bg-white">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItemField(index, 'quantity', e.target.value)}
                                                        placeholder="0"
                                                        min="1"
                                                        required
                                                        className="w-full h-8 px-2 text-center bg-transparent border-none text-xs font-black text-slate-900 outline-none focus:ring-0"
                                                    />
                                                </div>

                                                {/* Unit Cost */}
                                                <div className="px-3 py-3 relative border-l border-slate-200 flex items-center bg-white">
                                                    <span className="text-slate-400 text-[10px] font-black mr-1">{symbol}</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.cost}
                                                        onChange={e => updateItemField(index, 'cost', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        required
                                                        className="w-full h-8 text-right bg-transparent border-none text-xs font-black text-slate-900 font-mono outline-none focus:ring-0"
                                                    />
                                                </div>

                                                {/* Subtotal */}
                                                <div className="px-5 py-3 text-right bg-slate-50 border-l border-slate-200 flex items-center justify-end">
                                                    <span className={`text-[11px] font-black font-mono tracking-tighter ${subtotal > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {subtotal > 0 ? formatCurrency(subtotal, symbol) : '—'}
                                                    </span>
                                                </div>

                                                {/* Remove */}
                                                <div className="flex items-center justify-center py-3 border-l border-slate-200 bg-white">
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(index)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition-all border border-slate-200 hover:border-rose-700 shadow-sm"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Total footer */}
                                <div className="grid grid-cols-[1fr_100px_130px_130px_48px] bg-slate-900 text-white border-t border-slate-700">
                                    <div className="col-span-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center text-slate-400">
                                        Total Accumulation
                                    </div>
                                    <div className="px-5 py-4 text-right border-l border-slate-800 flex items-center justify-end">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black font-mono tracking-tighter leading-none">
                                                {formatCurrency(totalValue, symbol)}
                                            </span>
                                            <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mt-1">Net Valuation</span>
                                        </div>
                                    </div>
                                    <div className="border-l border-slate-800" />
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="shrink-0 px-8 py-5 border-t border-slate-200 flex items-center justify-between bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); resetForm(); }}
                                className="px-6 py-2.5 rounded-xl border border-slate-300 text-[10px] font-black text-slate-600 hover:bg-slate-100 hover:text-slate-900 uppercase tracking-widest transition-all active:scale-95"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-blue-500/30"
                            >
                                {loading ? (
                                    <><Activity size={16} className="animate-spin" /> Synchronizing…</>
                                ) : (
                                    <><FileText size={16} /> Finalize Manifest</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
