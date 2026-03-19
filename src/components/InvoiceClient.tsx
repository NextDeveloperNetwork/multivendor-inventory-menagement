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
        <div className="space-y-12 bg-white p-4">
            {/* product datalist for autocomplete */}
            <datalist id="inv-products">
                {products.map(p => <option key={p.id} value={p.name} />)}
            </datalist>

            {/* ── Controls Bar ── */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => setOpen(true)}
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3 text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        New Invoice
                    </button>

                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 font-mono text-sm">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date" value={startDate}
                            onChange={e => updateFilters('startDate', e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold focus:ring-0 text-slate-700 outline-none"
                        />
                        <span className="text-slate-300">→</span>
                        <input
                            type="date" value={endDate}
                            onChange={e => updateFilters('endDate', e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold focus:ring-0 text-slate-700 outline-none"
                        />
                    </div>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search invoice…"
                        className="w-full pl-11 pr-4 h-11 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-300 focus:border-blue-400 transition-all outline-none shadow-sm text-slate-900"
                        onKeyDown={e => {
                            if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                        }}
                    />
                </div>
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
                                    New Invoice
                                </DialogTitle>
                                <p className="text-slate-400 text-xs mt-0.5">Fill in the details and add articles below</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setOpen(false); resetForm(); }}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
                        {/* ── Info Row ── */}
                        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                            {/* Invoice # */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Hash size={10} /> Invoice No.
                                </label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-001"
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 transition-all uppercase"
                                />
                            </div>

                            {/* Supplier */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Store size={10} /> Supplier</span>
                                    <QuickAddSupplierDialog onAdd={s => { setSupplierId(s.id); router.refresh(); }} />
                                </label>
                                <div className="relative">
                                    <select
                                        value={supplierId}
                                        onChange={e => setSupplierId(e.target.value)}
                                        required
                                        className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 transition-all appearance-none"
                                    >
                                        <option value="">Select supplier…</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Destination type toggle */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={10} /> Destination type
                                </label>
                                <div className="flex h-10 p-1 bg-white border border-slate-200 rounded-xl gap-1">
                                    {(['warehouse', 'shop'] as const).map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => setDestinationType(t)}
                                            className={`flex-1 rounded-lg text-xs font-bold uppercase transition-all ${destinationType === t ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Destination selector */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {destinationType === 'warehouse' ? 'Warehouse' : 'Shop'}
                                </label>
                                <div className="relative">
                                    {destinationType === 'warehouse' ? (
                                        <select
                                            value={warehouseId}
                                            onChange={e => setWarehouseId(e.target.value)}
                                            required
                                            className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="">Select warehouse…</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    ) : (
                                        <select
                                            value={shopId}
                                            onChange={e => setShopId(e.target.value)}
                                            required
                                            className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="">Select shop…</option>
                                            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    )}
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* ── Articles Table ── */}
                        <div className="flex-1 overflow-y-auto px-8 py-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Articles — {items.filter(i => i.productId).length} matched
                                </span>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold uppercase transition-all"
                                >
                                    <Plus size={14} strokeWidth={3} /> Add row
                                </button>
                            </div>

                            {/* Excel-style grid */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_100px_130px_110px_44px] bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="px-4 py-2.5">Article / Product</div>
                                    <div className="px-3 py-2.5 text-center">Qty</div>
                                    <div className="px-3 py-2.5 text-right">Unit Cost</div>
                                    <div className="px-3 py-2.5 text-right">Subtotal</div>
                                    <div />
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
                                                className={`grid grid-cols-[1fr_100px_130px_110px_44px] items-center transition-colors ${rowIsValid ? 'bg-white' : 'bg-slate-50/50'}`}
                                            >
                                                {/* Product name */}
                                                <div className="px-4 py-2 flex flex-col gap-0.5">
                                                    <input
                                                        type="text"
                                                        list="inv-products"
                                                        value={item.productName}
                                                        onChange={e => handleProductNameChange(index, e.target.value)}
                                                        placeholder="Type to search product…"
                                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                                                        required
                                                    />
                                                    {matched && (
                                                        <span className="text-[9px] text-blue-500 font-bold font-mono px-1">
                                                            SKU: {matched.sku}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Qty */}
                                                <div className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItemField(index, 'quantity', e.target.value)}
                                                        placeholder="0"
                                                        min="1"
                                                        required
                                                        className="w-full h-9 px-2 text-center bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                                    />
                                                </div>

                                                {/* Unit Cost */}
                                                <div className="px-2 py-2 relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">{symbol}</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.cost}
                                                        onChange={e => updateItemField(index, 'cost', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        required
                                                        className="w-full h-9 pl-7 pr-2 text-right bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                                    />
                                                </div>

                                                {/* Subtotal */}
                                                <div className="px-3 py-2 text-right">
                                                    <span className={`text-sm font-bold font-mono ${subtotal > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                        {subtotal > 0 ? formatCurrency(subtotal, symbol) : '—'}
                                                    </span>
                                                </div>

                                                {/* Remove */}
                                                <div className="flex items-center justify-center py-2">
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(index)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
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
                                <div className="grid grid-cols-[1fr_100px_130px_110px_44px] bg-slate-50 border-t border-slate-200">
                                    <div className="col-span-3 px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                        Total
                                    </div>
                                    <div className="px-3 py-3 text-right">
                                        <span className="text-base font-black text-slate-900 font-mono">
                                            {formatCurrency(totalValue, symbol)}
                                        </span>
                                    </div>
                                    <div />
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="shrink-0 px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); resetForm(); }}
                                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                {loading ? (
                                    <><Activity size={16} className="animate-spin" /> Creating…</>
                                ) : (
                                    <><FileText size={16} /> Create Invoice</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Invoices List ── */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 bg-slate-50 flex justify-between items-center px-10">
                    <h3 className="text-xl font-black flex items-center gap-4 text-slate-900 uppercase tracking-tighter italic">
                        <FileText className="text-blue-500" size={24} />
                        Invoices
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                        {invoices.length} total
                    </span>
                </div>

                {invoices.length === 0 ? (
                    <div className="p-32 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="text-slate-200" size={36} />
                        </div>
                        <p className="text-lg font-black text-slate-300 uppercase tracking-tighter">No invoices yet</p>
                        <button
                            onClick={() => setOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-blue-600 transition-all"
                        >
                            <Plus size={16} /> Create first invoice
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="py-5 px-10 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Items</TableHead>
                                        <TableHead className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</TableHead>
                                        <TableHead className="py-5 px-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map(invoice => (
                                        <InvoiceDetailsDialog key={invoice.id} invoice={invoice} currency={currency}>
                                            <TableRow className="group cursor-pointer hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 h-20">
                                                <TableCell className="px-10 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm uppercase">{invoice.number}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">INV</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-slate-700 text-sm">
                                                        {new Date(invoice.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                            <Store size={13} />
                                                        </div>
                                                        <span className="font-semibold text-slate-700 text-sm">{invoice.supplier?.name || '—'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                        <Package size={12} className="text-blue-500" />
                                                        {invoice.items.length} articles
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-black text-slate-900 font-mono text-base">
                                                        {formatCurrency(
                                                            invoice.items.reduce((s: number, i: any) => s + Number(i.cost) * i.quantity, 0),
                                                            symbol
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-10 text-right">
                                                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                            <Eye size={18} />
                                                        </div>
                                                        <DeleteInvoiceButton id={invoice.id} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </InvoiceDetailsDialog>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile */}
                        <div className="grid grid-cols-1 gap-3 md:hidden p-4">
                            {invoices.map(invoice => (
                                <InvoiceDetailsDialog key={invoice.id} invoice={invoice} currency={currency}>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:border-blue-200 transition-all active:scale-[0.98]">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-base">#{invoice.number}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{new Date(invoice.date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="font-mono font-black text-slate-900">
                                                {formatCurrency(invoice.items.reduce((s: number, i: any) => s + Number(i.cost) * i.quantity, 0), symbol)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">{invoice.supplier?.name || '—'}</span>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500">
                                                <Package size={12} /> {invoice.items.length} items
                                            </div>
                                        </div>
                                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                                            <DeleteInvoiceButton id={invoice.id} />
                                        </div>
                                    </div>
                                </InvoiceDetailsDialog>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
