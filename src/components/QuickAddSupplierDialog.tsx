'use client';

import { useState } from 'react';
import { createSupplier } from '@/app/actions/supplier';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Store, X, Activity, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickAddSupplierDialog({ onAdd }: { onAdd?: (supplier: any) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createSupplier(formData);
        if (result.success) {
            toast.success('Supplier added');
            setOpen(false);
            if (onAdd) onAdd(result.supplier);
        } else {
            toast.error(result.error || 'Failed to create supplier');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1 rounded-lg transition-all uppercase tracking-wide"
                >
                    <Plus size={11} strokeWidth={3} /> New
                </button>
            </DialogTrigger>

                <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                    {/* Header Section */}
                    <DialogHeader className="bg-white px-8 py-6 border-b border-slate-100 flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
                                <Store size={22} strokeWidth={1.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 font-serif text-2xl tracking-tight uppercase italic">
                                    New Supplier Registration
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black italic">Create new supplier account</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                        >
                            <X size={18} />
                        </button>
                    </DialogHeader>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="flex flex-col bg-white">
                        <div className="px-8 py-8 space-y-6">
                            {/* Entity Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> Business Name
                                </label>
                                <input
                                    name="name"
                                    required
                                    placeholder="LEGAL_ENTITY_DESCRIPTOR"
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-300 placeholder:italic uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 flex items-center gap-2 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Official Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="OFFICIAL@BUSINESS.COM"
                                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all font-mono placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                    />
                                </div>

                                {/* Tax ID */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 flex items-center gap-2 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Tax Identity (TIN)
                                    </label>
                                    <input
                                        name="taxId"
                                        placeholder="TAX_ID_REF"
                                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all font-mono placeholder:text-slate-300 placeholder:italic uppercase"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Business Address
                                </label>
                                <input
                                    name="address"
                                    placeholder="BUSINESS_ADDRESS_REF"
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-white">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 px-8 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-slate-900/10"
                            >
                                {loading ? (
                                    <><Activity size={16} className="animate-spin" /> Registering...</>
                                ) : (
                                    <><Store size={16} /> Save Supplier</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>

        </Dialog>
    );
}
