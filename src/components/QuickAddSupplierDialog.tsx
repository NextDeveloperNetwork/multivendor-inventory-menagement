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

            <DialogContent className="max-w-sm w-[95vw] p-0 gap-0 rounded-3xl overflow-hidden border-none shadow-2xl flex flex-col">
                {/* Header */}
                <DialogHeader className="bg-slate-900 px-6 py-5 flex-row items-center justify-between space-y-0 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Store size={18} className="text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-bold text-base tracking-tight">
                                Add Supplier
                            </DialogTitle>
                            <p className="text-slate-400 text-[10px] mt-0.5">Register a new supplier</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    >
                        <X size={16} />
                    </button>
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col bg-white">
                    <div className="px-6 py-5 space-y-4">

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Store size={10} /> Company Name
                            </label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. Global Supplies Ltd."
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Mail size={10} /> Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="contact@supplier.com"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <MapPin size={10} /> Address
                            </label>
                            <input
                                name="address"
                                placeholder="Optional"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? (
                                <><Activity size={15} className="animate-spin" /> Saving…</>
                            ) : (
                                <><Store size={15} /> Add Supplier</>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
