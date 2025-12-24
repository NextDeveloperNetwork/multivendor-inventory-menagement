'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createInvoice, deleteInvoice } from '@/app/actions/invoice';
import { Plus, Trash2, FileText, Calendar, Search, Package, Store, Eye, Hash, MapPin, AlertTriangle, ChevronDown, ShoppingCart, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import InvoiceDetailsDialog from './InvoiceDetailsDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import DeleteInvoiceButton from './DeleteInvoiceButton';
import QuickAddProductDialog from './QuickAddProductDialog';
import QuickAddSupplierDialog from './QuickAddSupplierDialog';
import AssetCatalogDialog from './AssetCatalogDialog';

interface InvoiceClientProps {
    invoices: any[];
    products: any[];
    suppliers: any[];
    warehouses: any[];
    currency: { symbol: string; rate: number };
}

export default function InvoiceClient({ invoices, products, suppliers, warehouses, currency }: InvoiceClientProps) {
    const symbol = currency?.symbol || '$';
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showForm, setShowForm] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [items, setItems] = useState<Array<{ productId: string; quantity: string; cost: string }>>([
        { productId: '', quantity: '', cost: '' },
    ]);
    const [loading, setLoading] = useState(false);

    // Sync filters from URL
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const updateFilters = (field: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(field, value);
        else params.delete(field);
        router.push(`/admin/invoices?${params.toString()}`);
    };

    const addItem = () => {
        setItems([...items, { productId: '', quantity: '', cost: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const selectFromCatalog = (product: { id: string; cost?: number | string }) => {
        if (items.length === 1 && !items[0].productId) {
            setItems([{ productId: product.id, quantity: '1', cost: product.cost?.toString() || '' }]);
        } else {
            setItems([...items, { productId: product.id, quantity: '1', cost: product.cost?.toString() || '' }]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('number', invoiceNumber);
        formData.append('supplierId', supplierId);
        formData.append('warehouseId', warehouseId);
        formData.append('items', JSON.stringify(items.filter(item => item.productId && item.quantity && item.cost)));

        const result = await createInvoice(formData);

        if (result.success) {
            toast.success('Invoice created successfully');
            setInvoiceNumber('');
            setSupplierId('');
            setWarehouseId('');
            setItems([{ productId: '', quantity: '', cost: '' }]);
            setShowForm(false);
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    const totalValue = items.reduce((sum, item) => {
        const cost = parseFloat(item.cost) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (cost * qty);
    }, 0);

    return (
        <div className="space-y-12 bg-white p-4">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-blue-50 p-8 rounded-[2.5rem] border-2 border-blue-100 shadow-xl shadow-blue-500/5">
                <div className="flex flex-wrap items-center gap-6">
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-black text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-4 text-sm"
                        >
                            <Plus size={20} />
                            Log New Invoice
                        </button>
                    )}

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border-2 border-blue-100 shadow-sm">
                        <div className="flex items-center gap-4 px-4">
                            <Calendar size={20} className="text-blue-300" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => updateFilters('startDate', e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 text-black uppercase"
                            />
                        </div>
                        <div className="text-blue-100 font-black text-xs">—</div>
                        <div className="flex items-center gap-4 px-4">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => updateFilters('endDate', e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 text-black uppercase"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={24} />
                    <input
                        type="text"
                        placeholder="Search Ledger ID..."
                        className="w-full pl-14 pr-6 h-14 bg-white border-2 border-blue-100 rounded-2xl text-sm font-bold placeholder:text-blue-200 focus:border-blue-400 transition-all outline-none shadow-sm text-black"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                        }}
                    />
                </div>
            </div>

            {showForm && (
                <div className="bg-white border-2 border-blue-100 rounded-[3rem] shadow-2xl shadow-blue-500/10 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-xl">
                                <FileText size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight uppercase">New Invoice</h2>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2">Create Procurement Record</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setInvoiceNumber('');
                                setSupplierId('');
                                setWarehouseId('');
                                setItems([{ productId: '', quantity: '', cost: '' }]);
                            }}
                            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Left Column: Metadata */}
                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-[2rem] border-2 border-blue-100 space-y-8 shadow-sm">
                                <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-200 pb-4">Invoice Details</h3>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Invoice Number</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            placeholder="INV-001"
                                            className="w-full h-14 pl-14 pr-6 bg-white border-2 border-blue-200 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10 outline-none uppercase text-sm transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Supplier</label>
                                        <QuickAddSupplierDialog onAdd={(s) => {
                                            setSupplierId(s.id);
                                            router.refresh();
                                        }} />
                                    </div>
                                    <div className="relative group">
                                        <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <select
                                            value={supplierId}
                                            onChange={(e) => setSupplierId(e.target.value)}
                                            className="w-full h-14 pl-14 pr-12 bg-white border-2 border-blue-200 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10 outline-none uppercase text-sm appearance-none transition-all"
                                            required
                                        >
                                            <option value="">Select Supplier...</option>
                                            {suppliers.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Warehouse</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <select
                                            value={warehouseId}
                                            onChange={(e) => setWarehouseId(e.target.value)}
                                            className="w-full h-14 pl-14 pr-12 bg-white border-2 border-blue-200 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10 outline-none uppercase text-sm appearance-none transition-all"
                                            required
                                        >
                                            <option value="">Select Warehouse...</option>
                                            {warehouses.map((w) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="pt-6 border-t-2 border-blue-200">
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-[1.5rem] p-6 text-white shadow-xl shadow-emerald-500/20">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Amount</p>
                                        <h4 className="text-3xl font-black mt-1 tracking-tight">
                                            {formatCurrency(totalValue, symbol)}
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full h-20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Activity className="animate-spin" size={20} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={20} />
                                        Create Invoice
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Column: Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Invoice Items</h3>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">{items.filter(i => i.productId).length} Products Added</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <AssetCatalogDialog
                                        products={products}
                                        selectedIds={items.map(i => i.productId)}
                                        onSelect={selectFromCatalog}
                                    />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-xs"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                        Add Row
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-blue-100">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-widest text-slate-600">Product</TableHead>
                                                <TableHead className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-600 w-32">Quantity</TableHead>
                                                <TableHead className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-600 w-48">Unit Cost</TableHead>
                                                <TableHead className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-600 w-48">Subtotal</TableHead>
                                                <TableHead className="py-6 px-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-600 w-24">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => {
                                                const subtotal = (parseFloat(item.cost) || 0) * (parseInt(item.quantity) || 0);
                                                const product = products.find(p => p.id === item.productId);

                                                return (
                                                    <TableRow key={index} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border-b border-blue-50 last:border-0 h-24">
                                                        <TableCell className="px-10">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="font-bold text-sm text-slate-900">
                                                                    {product ? product.name : (
                                                                        <span className="text-slate-400 italic">Select a product...</span>
                                                                    )}
                                                                </div>
                                                                {product && (
                                                                    <div className="text-[9px] font-mono text-blue-400 uppercase font-bold">
                                                                        SKU: {product.sku}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                                className="w-24 h-12 bg-white border-2 border-blue-100 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10 text-center transition-all"
                                                                placeholder="0"
                                                                min="1"
                                                                required
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="relative inline-block w-full max-w-[160px]">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 font-bold text-sm">{symbol}</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.cost}
                                                                    onChange={(e) => updateItem(index, 'cost', e.target.value)}
                                                                    className="w-full h-12 pl-10 pr-4 bg-white border-2 border-blue-100 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10 text-right transition-all font-mono"
                                                                    placeholder="0.00"
                                                                    min="0"
                                                                    required
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-emerald-600 font-mono text-base">
                                                            {formatCurrency(subtotal, symbol)}
                                                        </TableCell>
                                                        <TableCell className="px-10 text-right">
                                                            {items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    className="w-12 h-12 flex items-center justify-center text-rose-400 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-xl transition-all border-2 border-rose-100 hover:border-rose-500 shadow-sm"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                                {items.length === 0 && (
                                    <div className="p-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                                            <ShoppingCart size={32} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Items Added</p>
                                            <p className="text-[10px] text-blue-300 font-bold uppercase mt-2">Click "Add Row" or browse the catalog</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Invoices List */}
            <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/5">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center px-12">
                    <h3 className="text-2xl font-black flex items-center gap-5 text-slate-900 uppercase tracking-tighter italic">
                        <FileText className="text-blue-600" size={28} />
                        Ledger Archive
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100 italic shadow-sm">
                        Audit Stream // 01
                    </span>
                </div>

                {invoices.length === 0 ? (
                    <div className="p-40 text-center">
                        <div className="w-28 h-28 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-full flex items-center justify-center mx-auto mb-10">
                            <FileText className="text-blue-100" size={56} />
                        </div>
                        <p className="text-2xl font-black text-black mb-4 uppercase tracking-tighter italic">Ledger Archive Inactive</p>
                        <p className="text-blue-200 font-bold max-w-sm mx-auto text-xs uppercase tracking-widest opacity-80 leading-relaxed">No telemetry detected in current scope.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="py-6 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger ID</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Origin Node</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Manifest</TableHead>
                                        <TableHead className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Valuation</TableHead>
                                        <TableHead className="py-6 px-12 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <InvoiceDetailsDialog key={invoice.id} invoice={invoice} currency={currency}>
                                            <TableRow className="group cursor-pointer hover:bg-blue-50/50 transition-all border-b border-slate-50 last:border-0 h-24">
                                                <TableCell className="px-12 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 tracking-tight text-lg underline decoration-blue-500/10 underline-offset-4 group-hover:decoration-blue-500/30">
                                                                {invoice.number}
                                                            </div>
                                                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1 opacity-60">CODE//INVC</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {new Date(invoice.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Validated</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                            <Store size={14} />
                                                        </div>
                                                        <span className="font-bold text-slate-600 text-sm uppercase tracking-tight">{invoice.supplier?.name || 'External'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                            <Package size={12} className="text-blue-500" />
                                                            {invoice.items.length} Article Segments
                                                        </span>
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 leading-none">Resource Entry</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-slate-900 italic text-xl">
                                                            {formatCurrency(invoice.items.reduce((sum: number, item: any) =>
                                                                sum + (Number(item.cost) * item.quantity), 0
                                                            ), symbol)}
                                                        </span>
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">USD Asset</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-12 text-right">
                                                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                            <Eye size={20} />
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

                        {/* Mobile View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                            {invoices.map((invoice) => (
                                <InvoiceDetailsDialog key={invoice.id} invoice={invoice} currency={currency}>
                                    <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm space-y-4 hover:border-blue-200 transition-all active:scale-[0.98]">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-lg">#{invoice.number}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">{new Date(invoice.date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="font-mono font-black text-slate-900 text-lg">
                                                {formatCurrency(invoice.items.reduce((sum: number, item: any) => sum + (Number(item.cost) * item.quantity), 0), symbol)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <Store size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{invoice.supplier?.name || 'External'}</span>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{invoice.items.length} Items</div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DeleteInvoiceButton id={invoice.id} />
                                            </div>
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
