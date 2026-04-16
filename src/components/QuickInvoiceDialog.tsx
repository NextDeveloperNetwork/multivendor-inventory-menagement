'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice } from '@/app/actions/invoice';
import { Plus, X, Package, ChevronDown, Activity, Minus, Trash2 } from 'lucide-react';
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

    const [invoiceNumber, setInvoiceNumber] = useState(`STK-${Date.now().toString().slice(-6)}`);
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);

    const resetForm = () => {
        setInvoiceNumber(`STK-${Date.now().toString().slice(-6)}`);
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
        if (validItems.length === 0) {
            toast.error('ADD AT LEAST ONE VALID ARTICLE', {
                className: 'bg-rose-50 text-rose-600 border-rose-200 uppercase tracking-widest font-black text-[9px]'
            });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('number', invoiceNumber);
        formData.append('supplierId', supplierId);
        formData.append('warehouseId', warehouseId);
        formData.append('date', invoiceDate);
        if (businessId) formData.append('businessId', businessId);
        formData.append('items', JSON.stringify(validItems));

        const result = await createInvoice(formData);
        if (result.success) {
            toast.success('INVENTORY SYNCHRONIZED', {
                className: 'bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-widest font-black text-[9px]'
            });
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
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
                <Plus size={12} strokeWidth={4} /> Missing Articles
            </button>

            {open && (
                <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
                        onClick={() => { setOpen(false); resetForm(); }} 
                    />

                    {/* Full-screen sheet */}
                    <div className="relative bg-slate-50 rounded-t-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-400" style={{ height: '94dvh' }}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Lean Header */}
                        <div className="px-6 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl rounded-t-[2.5rem] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-2 ring-white">
                                    <Package size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        STOCK INJECTOR
                                        <div className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100">SYNC</div>
                                    </h1>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">Register missing article inventory</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setOpen(false); resetForm(); }} 
                                className="w-9 h-9 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center text-slate-400 transition-all active:scale-95"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24 space-y-6 custom-scrollbar">
                                {/* Compact Meta Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference</label>
                                        <input
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                            className="w-full h-9 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono outline-none focus:bg-white focus:border-indigo-600 transition-all uppercase"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                        <input
                                            type="date"
                                            value={invoiceDate}
                                            onChange={e => setInvoiceDate(e.target.value)}
                                            className="w-full h-9 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none font-mono focus:bg-white focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor</label>
                                        <div className="relative">
                                            <select
                                                value={supplierId}
                                                onChange={e => setSupplierId(e.target.value)}
                                                required
                                                className="w-full h-9 px-4 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none cursor-pointer uppercase appearance-none focus:bg-white focus:border-indigo-600 transition-all"
                                            >
                                                <option value="">SELECT...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Node</label>
                                        <div className="relative">
                                            <select
                                                value={warehouseId}
                                                onChange={e => setWarehouseId(e.target.value)}
                                                required
                                                className="w-full h-9 px-4 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none cursor-pointer uppercase appearance-none focus:bg-white focus:border-indigo-600 transition-all text-indigo-600"
                                            >
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dense Article List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                                            <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">Article Catalog</label>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                type="button" 
                                                onClick={addRow} 
                                                className="flex items-center gap-1.5 text-[8px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-all"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                    <Plus size={12} strokeWidth={4} />
                                                </div>
                                                ROW
                                            </button>
                                            <div className="w-px h-5 bg-slate-200" />
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
                                            <div key={idx} className="bg-white border border-slate-200 rounded-[1.5rem] p-4 flex items-start gap-4 hover:border-indigo-300 transition-all group relative">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 shrink-0 mt-1.5 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                    {idx + 1}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Article</label>
                                                        <div className="relative">
                                                            <Activity size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                list="quick-prod-list"
                                                                value={item.productName}
                                                                onChange={e => handleProductNameChange(idx, e.target.value)}
                                                                className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none uppercase placeholder:text-slate-300 focus:bg-white focus:border-indigo-600 transition-all"
                                                                placeholder="CATALOG SEARCH..."
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 text-xs">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-center block">Qty</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateItemField(idx, 'quantity', e.target.value)}
                                                            className="w-full h-9 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-black outline-none focus:bg-white focus:border-indigo-600 tabular-nums transition-all"
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-right block">Cost ({currencySymbol})</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.cost}
                                                            onChange={e => updateItemField(idx, 'cost', e.target.value)}
                                                            className="w-full h-9 px-3 bg-slate-50 border border-slate-100 rounded-xl text-right text-xs font-bold outline-none italic focus:bg-white focus:border-emerald-600 transition-all tabular-nums text-emerald-600"
                                                            placeholder="0.00"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-right block">Total</label>
                                                        <div className="h-9 bg-slate-900 rounded-xl flex items-center justify-end px-3">
                                                            <span className="text-[10px] font-black text-emerald-400 font-mono tabular-nums">{currencySymbol}{item.total || '0.00'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    type="button" 
                                                    onClick={() => removeRow(idx)} 
                                                    className="w-9 h-9 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all shrink-0 mt-3.5"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        onClick={addRow}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:bg-white hover:text-indigo-600 hover:border-indigo-600 transition-all"
                                    >
                                        + APPEND ARTICLE
                                    </button>
                                </div>
                            </div>

                            {/* Efficient Control Center */}
                            <div className="shrink-0 px-6 pt-4 pb-10 border-t border-slate-200/60 bg-white/95 space-y-4" style={{ paddingBottom: 'calc(max(2.5rem, env(safe-area-inset-bottom)))' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                            <Activity size={14} />
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">GRAND TOTAL</span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{items.filter(i => i.productId).length} articles recognized</span>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter tabular-nums">{currencySymbol}{lineTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>SYNCHRONIZING...</>
                                    ) : (
                                        <>COMMIT STOCK INJECTION <Plus size={16} strokeWidth={4} /></>
                                    )}
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
