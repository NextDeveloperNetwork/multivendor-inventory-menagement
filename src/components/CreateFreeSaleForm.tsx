'use client';

import React, { useState } from 'react';
import { createFreeSale } from '@/app/actions/salesOps';
import { toast } from 'sonner';
import { Package, Send, Plus, Minus, Loader2, X, Banknote, Trash2, Check } from 'lucide-react';

interface SaleItem {
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

export default function CreateFreeSaleForm({ userName, currencySymbol = '$' }: { userName: string; currencySymbol?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<SaleItem[]>([]);
    const [currentItem, setCurrentItem] = useState<SaleItem>({ productName: '', quantity: 1, price: 0, total: 0 });
    const [notes, setNotes] = useState('');

    const addItem = () => {
        if (!currentItem.productName.trim() || currentItem.quantity <= 0 || currentItem.price <= 0) {
            toast.error('Fill in item name, quantity and price');
            return;
        }
        setItems([...items, { ...currentItem, total: currentItem.quantity * currentItem.price }]);
        setCurrentItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };

    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async () => {
        if (items.length === 0) { toast.error('Add at least one item'); return; }
        setIsLoading(true);
        const res = await createFreeSale({ items, totalAmount, soldBy: userName, notes });
        setIsLoading(false);
        if (res.success) {
            toast.success('Sale registered!');
            setItems([]);
            setNotes('');
            setIsOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || 'Failed to register sale');
        }
    };

    return (
        <>
            {/* FAB Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/40 active:scale-95 transition-all hover:bg-emerald-600"
            >
                <Plus size={16} strokeWidth={3} /> New Sale
            </button>

            {/* Bottom Sheet Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sheet */}
                    <div className="relative bg-slate-100 rounded-t-[2.5rem] max-h-[94dvh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.3)] overflow-hidden">

                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Banknote size={19} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-slate-900 leading-none">New Sale</h2>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manual Registration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                            {/* Item Input */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Add Item</p>

                                <input
                                    type="text"
                                    placeholder="Product name..."
                                    value={currentItem.productName}
                                    onChange={e => setCurrentItem({ ...currentItem, productName: e.target.value })}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Quantity stepper */}
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentItem({ ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) })}
                                            className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="number"
                                            value={currentItem.quantity}
                                            onChange={e => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                                            className="flex-1 bg-transparent text-center text-sm font-black text-slate-900 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCurrentItem({ ...currentItem, quantity: currentItem.quantity + 1 })}
                                            className="w-12 h-full flex items-center justify-center text-slate-500 active:bg-slate-100"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <span className="pl-4 text-sm font-black text-slate-400 shrink-0">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={currentItem.price || ''}
                                            onChange={e => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                                            className="flex-1 pl-2 pr-4 bg-transparent text-sm font-black text-slate-900 outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full h-12 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                >
                                    <Plus size={16} /> Add to Cart
                                </button>
                            </div>

                            {/* Cart items */}
                            {items.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Cart ({items.length})</p>
                                        <button onClick={() => setItems([])} className="text-[9px] font-bold text-rose-500">Clear all</button>
                                    </div>
                                    {items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                                <Package size={14} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate">{item.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{item.quantity} × {currencySymbol}{item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <p className="text-sm font-black text-slate-900">{currencySymbol}{item.total.toFixed(2)}</p>
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 active:scale-90"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Notes (optional)</p>
                                <textarea
                                    placeholder="Any additional context..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="px-5 pt-3 pb-8 border-t border-slate-200/60 bg-slate-100 shrink-0">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-xl font-black text-slate-900 tabular-nums">
                                    {currencySymbol}{totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || items.length === 0}
                                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-40 hover:bg-emerald-600"
                            >
                                {isLoading
                                    ? <Loader2 size={20} className="animate-spin" />
                                    : <><Check size={18} /> Confirm Sale</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
