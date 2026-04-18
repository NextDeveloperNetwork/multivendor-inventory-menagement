'use client';

import React, { useState } from 'react';
import { createFreeSale } from '@/app/actions/salesOps';
import { toast } from 'sonner';
import { Package, Send, Plus, Minus, ClipboardList, Loader2, X, Banknote, Trash2 } from 'lucide-react';

interface SaleItem {
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

export default function CreateFreeSaleForm({ userName }: { userName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<SaleItem[]>([]);
    const [currentItem, setCurrentItem] = useState<SaleItem>({ productName: '', quantity: 1, price: 0, total: 0 });
    const [notes, setNotes] = useState('');

    const addItem = () => {
        if (!currentItem.productName.trim() || currentItem.quantity <= 0 || currentItem.price <= 0) {
            toast.error('Enter valid item name, quantity and price');
            return;
        }
        setItems([...items, { ...currentItem, total: currentItem.quantity * currentItem.price }]);
        setCurrentItem({ productName: '', quantity: 1, price: 0, total: 0 });
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            toast.error('Add at least one item');
            return;
        }
        setIsLoading(true);
        const res = await createFreeSale({ 
            items, 
            totalAmount, 
            soldBy: userName,
            notes 
        });
        setIsLoading(false);
        if (res.success) {
            toast.success('Sale registered successfully');
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
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
                <Plus size={15} strokeWidth={3} /> New Free Sale
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative bg-white rounded-t-[2.5rem] shadow-2xl max-h-[96vh] flex flex-col">
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-6 pb-4 pt-2 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                                    <Banknote size={18} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-slate-900 leading-none">External Sale</h2>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Multi-Item Registration</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Item Input Section */}
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Name</label>
                                    <input
                                        type="text"
                                        placeholder="Article description..."
                                        value={currentItem.productName}
                                        onChange={e => setCurrentItem({ ...currentItem, productName: e.target.value })}
                                        className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 outline-none focus:border-emerald-400 uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItem({ ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) })}
                                                className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500"
                                            >
                                                <Minus size={12} />
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
                                                className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Price</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={currentItem.price || ''}
                                            onChange={e => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 outline-none focus:border-emerald-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full h-10 bg-emerald-100 text-emerald-700 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors"
                                >
                                    <Plus size={14} /> Add to List
                                </button>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Items Cart ({items.length})</label>
                                {items.length === 0 ? (
                                    <div className="py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
                                        <Package size={24} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">No items added yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-black text-slate-900 uppercase truncate">{item.productName}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                                        {item.quantity} x ${item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xs font-black text-slate-900">${item.total.toFixed(2)}</p>
                                                    <button onClick={() => removeItem(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Notes</label>
                                <textarea
                                    placeholder="Any additional details..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer / Submit */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-xl font-black text-slate-900">${totalAmount.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || items.length === 0}
                                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Confirm Registration</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
