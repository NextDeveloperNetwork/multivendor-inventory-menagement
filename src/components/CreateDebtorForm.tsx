'use client';

import React, { useState } from 'react';
import { createDebtor } from '@/app/actions/salesOps';
import { toast } from 'sonner';
import { UserMinus, Wallet, Send, Plus, Loader2, Phone, X, Package, Trash2, Minus } from 'lucide-react';

interface DebtorItem {
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

export default function CreateDebtorForm({ currencySymbol = '$' }: { currencySymbol?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [items, setItems] = useState<DebtorItem[]>([]);
    const [currentItem, setCurrentItem] = useState<DebtorItem>({ productName: '', quantity: 1, price: 0, total: 0 });
    const [notes, setNotes] = useState('');

    const addItem = () => {
        if (!currentItem.productName.trim() || currentItem.quantity <= 0 || currentItem.price <= 0) {
            toast.error('Enter valid article name, quantity and price');
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
        if (!clientName) {
            toast.error('Patiently provide the client name');
            return;
        }
        if (items.length === 0) {
            toast.error('Add at least one article to this credit');
            return;
        }
        
        setIsLoading(true);
        const res = await createDebtor({
            name: clientName,
            phone: clientPhone,
            amount: totalAmount,
            notes,
            items
        });
        setIsLoading(false);
        
        if (res.success) {
            toast.success('Credit dispatch registered in ledger');
            setClientName('');
            setClientPhone('');
            setItems([]);
            setNotes('');
            setIsOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || 'Failed to update ledger');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
                <Plus size={16} strokeWidth={3} /> Record New Credit
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-white rounded-t-[3rem] shadow-2xl max-h-[98vh] flex flex-col">
                        {/* Handle */}
                        <div className="flex justify-center pt-4 pb-2 shrink-0">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pb-6 pt-4 border-b border-slate-50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-100">
                                    <Wallet size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Credit Terminal</h2>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Dispatch & Debt Registry</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                            {/* Client Identification */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Debtor Name</label>
                                    <div className="relative">
                                        <X className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 cursor-pointer" size={14} onClick={() => setClientName('')} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="John Doe..."
                                            value={clientName}
                                            onChange={e => setClientName(e.target.value)}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:shadow-xl focus:shadow-emerald-50 transition-all uppercase italic"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="tel"
                                            placeholder="+xxx..."
                                            value={clientPhone}
                                            onChange={e => setClientPhone(e.target.value)}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:shadow-xl focus:shadow-emerald-50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cart Constructor */}
                            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center"><Plus size={12} className="text-emerald-600" /></div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Add Article to Credit</h3>
                                </div>
                                
                                <div className="space-y-2.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Article Description</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Steel Pipe 40mm..."
                                        value={currentItem.productName}
                                        onChange={e => setCurrentItem({ ...currentItem, productName: e.target.value })}
                                        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-emerald-400 uppercase italic shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItem({ ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) })}
                                                className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <input
                                                readOnly
                                                value={currentItem.quantity}
                                                className="flex-1 bg-transparent text-center text-sm font-black text-slate-900 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItem({ ...currentItem, quantity: currentItem.quantity + 1 })}
                                                className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Price per Piece ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={currentItem.price || ''}
                                            onChange={e => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-emerald-400 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                                >
                                    <Plus size={16} /> Confirm Item
                                </button>
                            </div>

                            {/* Manifest / Cart List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Credit Manifest</label>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{items.length} Items</span>
                                </div>
                                {items.length === 0 ? (
                                    <div className="py-12 text-center bg-slate-50/30 border border-dashed border-slate-200 rounded-[2rem]">
                                        <Package size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div key={index} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-xl transition-all">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-slate-900 uppercase italic truncate">{item.productName}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-wider tabular-nums">
                                                        {item.quantity} units @ {currencySymbol}{item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <p className="text-sm font-black text-slate-900 italic tabular-nums">{currencySymbol}{item.total.toLocaleString()}</p>
                                                    <button onClick={() => removeItem(index)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Additional Intelligence */}
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ledger Notes</label>
                                <textarea
                                    placeholder="Dispatch conditions, due dates, guarantees..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-medium text-slate-600 placeholder:text-slate-300 outline-none focus:bg-white focus:border-emerald-400 transition-all resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Summary & Dispatch */}
                        <div className="p-8 border-t border-slate-50 bg-slate-50/50 shrink-0 rounded-b-[3rem]">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Total Debt Amount</span>
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic leading-none">Awaiting reconciliation</span>
                                    </div>
                                </div>
                                <span className="text-4xl font-black italic tabular-nums text-slate-900 tracking-tighter">{currencySymbol}{totalAmount.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || items.length === 0 || !clientName}
                                className="group relative w-full h-18 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-40 shadow-2xl shadow-emerald-500/30 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                {isLoading ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                        Commit to Ledger
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
