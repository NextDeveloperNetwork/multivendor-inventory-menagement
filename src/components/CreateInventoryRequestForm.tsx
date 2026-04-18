'use client';

import React, { useState } from 'react';
import { createInventoryRequest } from '@/app/actions/salesOps';
import { toast } from 'sonner';
import { Package, Send, Plus, Minus, ClipboardList, Loader2, X, ChevronDown } from 'lucide-react';

export default function CreateInventoryRequestForm({ products, userName }: { products: any[], userName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ productId: '', productName: '', quantity: 1, notes: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productName.trim() || formData.quantity <= 0) {
            toast.error('Enter an item name and valid quantity');
            return;
        }
        setIsLoading(true);
        const res = await createInventoryRequest({ ...formData, requestedBy: userName });
        setIsLoading(false);
        if (res.success) {
            toast.success('Request submitted to admin');
            setFormData({ productId: '', productName: '', quantity: 1, notes: '' });
            setIsOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || 'Failed to submit request');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
                <Plus size={15} strokeWidth={3} /> New Request
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Sheet */}
                    <div className="relative bg-white rounded-t-[2.5rem] shadow-2xl max-h-[92vh] flex flex-col">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 pt-2 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                                    <ClipboardList size={18} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-slate-900 leading-none">New Requisition</h2>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Inventory Restock Request</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Product */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter article name..."
                                        value={formData.productName}
                                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                        required
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 uppercase"
                                    />
                                    <Package size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Quantity stepper */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity Required</label>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                                        className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95 shadow-sm"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="flex-1 bg-transparent text-center text-2xl font-black text-slate-900 outline-none tabular-nums"
                                        min="1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                                        className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 active:scale-95 shadow-sm"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Requester info */}
                            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black">
                                    {userName[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-wide">{userName}</p>
                                    <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest">Authorized Requester</p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes (Optional)</label>
                                <textarea
                                    placeholder="Urgency level, reason, etc..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-400 resize-none transition-colors"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl mb-2"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Submit Request</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
