'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice } from '@/app/actions/invoice';
import { Plus, X, Package, ChevronDown, Activity, Minus } from 'lucide-react';
import { toast } from 'sonner';
import BatchAddProductDialog from './BatchAddProductDialog';

interface QuickInvoiceDialogProps {
    products: any[];
    suppliers: any[];
    warehouses: any[];
    shops: any[];
    categories: any[];
    units: any[];
    currencySymbol?: string;
    businessId: string | null;
}

type LineItem = { productId: string; productName: string; quantity: string; cost: string; total: string };
const emptyItem = (): LineItem => ({ productId: '', productName: '', quantity: '', cost: '', total: '' });

export default function QuickInvoiceDialog({
    products, suppliers, warehouses, shops, categories, units, currencySymbol = '$', businessId
}: QuickInvoiceDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [invoiceNumber, setInvoiceNumber] = useState(`QIN-${Date.now().toString().slice(-6)}`);
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);

    const resetForm = () => {
        setInvoiceNumber(`QIN-${Date.now().toString().slice(-6)}`);
        setSupplierId('');
        setItems([emptyItem()]);
    };

    const addRow = () => setItems(prev => [...prev, emptyItem()]);
    const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const updateItemField = (index: number, field: keyof LineItem, value: string) => {
        setItems(prev => {
            const next = [...prev];
            const item = { ...next[index], [field]: value };
            if (field === 'cost' || field === 'quantity') {
                item.total = ((parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0)).toFixed(2);
            }
            next[index] = item;
            return next;
        });
    };

    const handleProductNameChange = (index: number, val: string) => {
        const matched = products.find(p => p.name.toLowerCase() === val.toLowerCase());
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], productName: val, productId: matched?.id || '', cost: matched?.cost?.toString() || '' };
            return next;
        });
    };

    const lineTotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const validItems = items.filter(i => i.productId && i.quantity && i.cost);
        if (validItems.length === 0) { toast.error('Add at least one valid item'); setLoading(false); return; }

        const formData = new FormData();
        formData.append('number', invoiceNumber);
        formData.append('supplierId', supplierId);
        formData.append('warehouseId', warehouseId);
        formData.append('date', invoiceDate);
        if (businessId) formData.append('businessId', businessId);
        formData.append('items', JSON.stringify(validItems));

        const result = await createInvoice(formData);
        if (result.success) {
            toast.success('Inventory Updated');
            resetForm();
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 bg-rose-50 px-3 py-2.5 rounded-xl border border-rose-100 text-rose-600 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
            >
                <Plus size={13} strokeWidth={3} /> Missing Items
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setOpen(false); resetForm(); }} />

                    {/* Full-screen sheet */}
                    <div className="relative bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col" style={{ height: '95vh' }}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 shrink-0">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Dark header */}
                        <div className="bg-slate-900 mx-4 mt-3 rounded-2xl px-5 py-4 shrink-0 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-white italic uppercase tracking-tight">Express Stock Entry</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Register missing inventory</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-600 px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">OVERRIDE</div>
                                <button onClick={() => { setOpen(false); resetForm(); }} className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                                {/* Meta fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Doc Ref #</label>
                                        <input
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:border-blue-400 uppercase transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                                        <input
                                            type="date"
                                            value={invoiceDate}
                                            onChange={e => setInvoiceDate(e.target.value)}
                                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none font-mono focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
                                        <div className="relative">
                                            <select
                                                value={supplierId}
                                                onChange={e => setSupplierId(e.target.value)}
                                                required
                                                className="w-full h-10 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer uppercase appearance-none focus:border-blue-400"
                                            >
                                                <option value="">Vendor...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Warehouse</label>
                                        <div className="relative">
                                            <select
                                                value={warehouseId}
                                                onChange={e => setWarehouseId(e.target.value)}
                                                required
                                                className="w-full h-10 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer uppercase appearance-none focus:border-blue-400"
                                            >
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Line Items</label>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={addRow} className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                                <Plus size={12} strokeWidth={3} /> Row
                                            </button>
                                            <div className="w-px h-4 bg-slate-200" />
                                            <BatchAddProductDialog
                                                selectedBusinessId={businessId}
                                                categories={categories}
                                                units={units}
                                                onSuccess={() => router.refresh()}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                                {/* Row number + delete */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Line {idx + 1}</span>
                                                    <button type="button" onClick={() => removeRow(idx)} className="w-6 h-6 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-500">
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                                {/* Article */}
                                                <div className="mb-3">
                                                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Article</label>
                                                    <input
                                                        type="text"
                                                        list="quick-prod-list"
                                                        value={item.productName}
                                                        onChange={e => handleProductNameChange(idx, e.target.value)}
                                                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none uppercase placeholder:text-slate-300 focus:border-blue-400 transition-colors"
                                                        placeholder="Search catalog..."
                                                    />
                                                </div>
                                                {/* Qty + Cost + Total */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Qty</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateItemField(idx, 'quantity', e.target.value)}
                                                            className="w-full h-10 bg-white border border-slate-200 rounded-xl text-center text-sm font-black outline-none focus:border-blue-400 transition-colors"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cost</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.cost}
                                                            onChange={e => updateItemField(idx, 'cost', e.target.value)}
                                                            className="w-full h-10 bg-white border border-slate-200 rounded-xl text-right text-sm font-bold outline-none italic focus:border-blue-400 transition-colors px-2"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total</label>
                                                        <div className="h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-end px-2">
                                                            <span className="text-sm font-black text-slate-900 tabular-nums">{currencySymbol}{item.total || '0.00'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky footer */}
                            <div className="shrink-0 px-4 pt-3 pb-6 border-t border-slate-100 bg-white space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice Total</span>
                                    <span className="text-xl font-black text-slate-900 font-mono tabular-nums">{currencySymbol}{lineTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
                                >
                                    {loading ? <><Activity size={16} className="animate-spin" /> Processing...</> : 'Commit Stock Entry'}
                                </button>
                            </div>
                        </form>

                        <datalist id="quick-prod-list">
                            {products.map(p => <option key={p.id} value={p.name} />)}
                        </datalist>
                    </div>
                </div>
            )}
        </>
    );
}
