'use client';

import React, { useState } from 'react';
import { createDebtor } from '@/app/actions/salesOps';
import { toast } from 'sonner';
import { UserMinus, Wallet, Send, Plus, Loader2, Phone, X } from 'lucide-react';

export default function CreateDebtorForm({ currencySymbol = '$' }: { currencySymbol?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', amount: 0, notes: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || formData.amount <= 0) {
            toast.error('Provide client name and a valid amount');
            return;
        }
        setIsLoading(true);
        const res = await createDebtor(formData);
        setIsLoading(false);
        if (res.success) {
            toast.success('Debtor logged in ledger');
            setFormData({ name: '', phone: '', amount: 0, notes: '' });
            setIsOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || 'Failed to register debtor');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
                <Plus size={15} strokeWidth={3} /> Record Credit
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-white rounded-t-[2.5rem] shadow-2xl max-h-[92vh] flex flex-col">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 pt-2 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                                    <Wallet size={18} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-slate-900 leading-none">Credit Dispatch</h2>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Debtor Registry Entry</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Full Name..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 uppercase placeholder:text-slate-300 placeholder:normal-case transition-colors"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone (Optional)</label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="+xxx xxx xxx..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            {/* Amount — large prominent input */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Owed</label>
                                <div className="relative bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center px-4 focus-within:border-emerald-400 transition-colors">
                                    <span className="text-2xl font-black text-emerald-600 mr-2 shrink-0">{currencySymbol}</span>
                                    <input
                                        required
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={formData.amount || ''}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="flex-1 h-16 bg-transparent text-3xl font-black text-slate-900 outline-none tabular-nums"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes (Optional)</label>
                                <textarea
                                    placeholder="Items on credit, terms, reference..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-emerald-400 resize-none transition-colors"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 mb-2"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Record in Ledger</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
