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

type LineItem = { productId: string; productName: string; quantity: string; cost: string; total: string };

const emptyItem = (): LineItem => ({ productId: '', productName: '', quantity: '', cost: '', total: '' });

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
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

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
        setInvoiceDate(new Date().toISOString().split('T')[0]);
    };

    const addRow = () => setItems(prev => [...prev, emptyItem()]);
    const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const updateItemField = (index: number, field: keyof LineItem, value: string) => {
        setItems(prev => {
            const next = [...prev];
            const item = { ...next[index], [field]: value };
            
            if (field === 'cost') {
                const q = parseFloat(item.quantity) || 0;
                const c = parseFloat(value) || 0;
                item.total = (q * c).toFixed(2);
            } else if (field === 'total') {
                const q = parseFloat(item.quantity) || 0;
                const t = parseFloat(value) || 0;
                if (q > 0) {
                    item.cost = (t / q).toFixed(4);
                }
            } else if (field === 'quantity') {
                const q = parseFloat(value) || 0;
                const c = parseFloat(item.cost) || 0;
                const t = parseFloat(item.total) || 0;
                
                // If we have cost but no total, or if we have both, update total
                if (c > 0) {
                    item.total = (q * c).toFixed(2);
                } 
                // If we have total but no cost, update cost
                else if (t > 0) {
                    item.cost = (t / q).toFixed(4);
                }
            }
            
            next[index] = item;
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
        formData.append('date', invoiceDate);
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
                        Register Invoice
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
                        placeholder="Search records by number..."
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
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{invoices.length} Financial Records Managed</span>
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
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 italic">Clear filters or create a new entry</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block min-w-[1000px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-slate-300">
                                        <TableHead className="w-[180px] py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-700">Invoice #</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Entry Date</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Supplier / Vendor</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Quantity</TableHead>
                                        <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-700">Total Cost</TableHead>
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
                                                                 <div className="text-[9px] text-slate-500 font-bold font-mono tracking-tighter uppercase">Record ID</div>
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
                                                                 <span className="font-bold text-slate-900 text-xs">{invoice.supplier?.name || 'Unknown Supplier'}</span>
                                                                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight line-clamp-1">{invoice.supplier?.email || 'No Email Provided'}</span>
                                                             </div>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell>
                                                         <div className="flex items-center gap-2">
                                                             <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200 shadow-sm">
                                                                 <Package size={11} className="mr-1.5" />
                                                                 <span className="text-[10px] font-black uppercase tracking-tighter">{invoice.items.length} Units</span>
                                                             </div>
                                                             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Itemized</span>
                                                         </div>
                                                     </TableCell>
                                                     <TableCell className="text-right">
                                                         <div className="flex flex-col items-end">
                                                             <span className="font-black text-slate-900 font-mono text-sm tracking-tight">
                                                                 {formatCurrency(subTotalValue, symbol)}
                                                             </span>
                                                             <div className="flex items-center gap-1">
                                                                 <div className={`w-1 h-1 rounded-full ${subTotalValue > 1000 ? 'bg-emerald-600' : 'bg-blue-600'}`} />
                                                                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Verified</span>
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
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Supplier</span>
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{invoice.supplier?.name || 'Unknown Supplier'}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Quantity</span>
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
                <DialogContent className="max-w-[1200px] w-[98vw] p-0 gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl max-h-[95vh] flex flex-col bg-white">
                    {/* Header */}
                    <DialogHeader className="bg-white px-10 py-8 flex-row items-center justify-between space-y-0 shrink-0 border-b border-slate-100">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <FileText size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none uppercase italic">
                                    Purchase Invoice Registry
                                </DialogTitle>
                                <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-black italic">Inventory Procurement & Asset Entry</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Financial Entry
                            </div>
                            <button
                                onClick={() => { setOpen(false); resetForm(); }}
                                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200 shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
                        {/* ── Info Row ── */}
                        <div className="bg-slate-50/50 border-b border-slate-200 px-10 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 shrink-0">
                            {/* Invoice # */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2 italic">
                                    01. Invoice Reference #
                                </label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-XXXX-XX"
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-300 font-mono"
                                />
                            </div>

                            {/* Supplier */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center justify-between leading-none italic">
                                    <span>02. Issuing Supplier</span>
                                    <QuickAddSupplierDialog onAdd={s => { setSupplierId(s.id); router.refresh(); }} />
                                </label>
                                <div className="relative">
                                    <select
                                        value={supplierId}
                                        onChange={e => setSupplierId(e.target.value)}
                                        required
                                        className="w-full h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select vendor…</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Date Selector */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2 italic">
                                    03. Document Fiscal Date
                                </label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={e => setInvoiceDate(e.target.value)}
                                    required
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all uppercase font-mono"
                                />
                            </div>

                            {/* Destination */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] italic">
                                        04. Target Inventory Unit
                                    </label>
                                    <div className="flex bg-slate-200 p-0.5 rounded-lg scale-90 origin-right">
                                        {(['warehouse', 'shop'] as const).map(t => (
                                            <button
                                                key={t} type="button"
                                                onClick={() => setDestinationType(t)}
                                                className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${destinationType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                {t === 'warehouse' ? 'Warehouse' : 'Retail Shop'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    {destinationType === 'warehouse' ? (
                                        <select
                                            value={warehouseId}
                                            onChange={e => setWarehouseId(e.target.value)}
                                            required
                                            className="w-full h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select location…</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>)}
                                        </select>
                                    ) : (
                                        <select
                                            value={shopId}
                                            onChange={e => setShopId(e.target.value)}
                                            required
                                            className="w-full h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select location…</option>
                                            {shops.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                        </select>
                                    )}
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* ── Articles Table ── */}
                        <div className="flex-1 overflow-y-auto px-10 py-10 bg-white">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-serif text-slate-900 tracking-tight">Invoice Line Items</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Itemized Purchase List</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="group flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white active:scale-95 shadow-sm"
                                >
                                    <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Add Product
                                </button>
                            </div>

                            <div className="border-t border-x border-slate-100 rounded-t-2xl overflow-hidden shadow-sm">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_120px_160px_160px_60px] bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    <div className="px-6 py-4">Description / Product Asset</div>
                                    <div className="px-6 py-4 text-center border-l border-slate-100">Quantity</div>
                                    <div className="px-6 py-4 text-right border-l border-slate-100 italic">Unit Cost ({symbol})</div>
                                    <div className="px-6 py-4 text-right border-l border-slate-100">Aggregate Total ({symbol})</div>
                                    <div className="border-l border-slate-100" />
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-slate-100">
                                    {items.map((item, index) => {
                                        const matched = products.find(p => p.id === item.productId);
                                        const subtotal = (parseFloat(item.cost) || 0) * (parseInt(item.quantity) || 0);
                                        const rowIsValid = !!item.productId;

                                        return (
                                            <div
                                                key={index}
                                                className={`grid grid-cols-[1fr_120px_160px_160px_60px] items-stretch transition-all ${rowIsValid ? 'bg-white' : 'bg-white/50'}`}
                                            >
                                                {/* Product name */}
                                                <div className="px-6 py-4 flex flex-col justify-center focus-within:bg-slate-50/50 transition-all border-r border-transparent focus-within:border-slate-200">
                                                    <input
                                                        type="text"
                                                        list="inv-products"
                                                        value={item.productName}
                                                        onChange={e => handleProductNameChange(index, e.target.value)}
                                                        placeholder="Item description or SKU…"
                                                        className="w-full h-8 px-0 bg-transparent border-none text-[13px] text-slate-900 font-bold outline-none placeholder:text-slate-300 uppercase tracking-tight"
                                                        required
                                                    />
                                                    {matched && (
                                                        <div className="mt-1">
                                                            <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase tabular-nums">Ref: {matched.sku}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quantity */}
                                                <div className="px-4 py-4 border-l border-slate-100 flex items-center justify-center">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItemField(index, 'quantity', e.target.value)}
                                                        placeholder="0"
                                                        min="1"
                                                        required
                                                        className="w-full h-full text-center bg-transparent border-none text-sm font-black text-slate-900 outline-none tabular-nums"
                                                    />
                                                </div>

                                                {/* Unit Cost */}
                                                <div className="px-6 py-4 border-l border-slate-100 flex items-center bg-white focus-within:bg-slate-50/50 transition-all">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.cost}
                                                        onChange={e => updateItemField(index, 'cost', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        required
                                                        className="w-full h-full text-right bg-transparent border-none text-sm font-bold text-slate-900 font-mono outline-none tabular-nums italic"
                                                    />
                                                </div>

                                                {/* Total */}
                                                <div className="px-6 py-4 text-right bg-slate-50/30 border-l border-slate-100 flex items-center justify-end">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.total}
                                                        onChange={e => updateItemField(index, 'total', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-full text-right bg-transparent border-none text-sm font-black text-slate-800 font-mono outline-none tabular-nums shadow-[inset_-2px_0_0_rgba(15,23,42,0.1)]"
                                                    />
                                                </div>

                                                {/* Remove */}
                                                <div className="flex items-center justify-center py-4 border-l border-slate-100 bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(index)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-100 hover:border-slate-900"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Aggregation Footer */}
                            <div className="mt-1 grid grid-cols-[1fr_400px] gap-0">
                                <div className="bg-slate-50 rounded-bl-2xl px-10 py-10 border-l border-b border-slate-100 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Activity size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Invoice Fiscal Aggregate</span>
                                    </div>
                                </div>
                                <div className="bg-slate-900 text-white rounded-br-2xl px-10 py-10 flex items-center justify-between shadow-xl">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Grand Total</span>
                                        <span className="text-4xl font-black font-serif tracking-tighter tabular-nums leading-none">
                                            {formatCurrency(totalValue, symbol)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end text-right">
                                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{currency.code || 'BASE'}</span>
                                        <span className="text-slate-500 text-[9px] font-bold uppercase italic mt-1 underline decoration-slate-700 underline-offset-4 font-mono">Authenticated Record</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ── */}
                        <div className="shrink-0 px-10 py-8 border-t border-slate-200 flex items-center justify-between bg-white">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); resetForm(); }}
                                className="px-8 py-3 rounded-2xl border-2 border-slate-100 text-[11px] font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 uppercase tracking-[0.15em] transition-all active:scale-95"
                            >
                                Discard Entries
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-14 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 flex items-center gap-4 shadow-xl shadow-slate-900/10"
                            >
                                {loading ? (
                                    <><Activity size={18} className="animate-spin" /> Processing Invoice…</>
                                ) : (
                                    <><FileText size={18} /> Register Financial Document</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
