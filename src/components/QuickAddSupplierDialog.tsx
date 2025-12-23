'use client';

import { useState } from 'react';
import { createSupplier } from '@/app/actions/supplier';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Store } from 'lucide-react';
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
            toast.success('Supplier added successfully');
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
                <button className="text-[10px] font-black text-blue-500 bg-white border border-blue-100 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all uppercase flex items-center gap-2">
                    <Plus size={12} /> New Node
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <div className="bg-black p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <Store className="text-blue-500" /> Source Initialization
                        </DialogTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize External Logic Node</p>
                    </DialogHeader>
                </div>
                <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Supplier Entity Name</label>
                        <input name="name" required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="e.g. Global Dynamics Ltd." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Contact Channel (Email)</label>
                        <input name="email" type="email" className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="contact@supplier.node" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Operations Address</label>
                        <input name="address" className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="Physical Logistics Point..." />
                    </div>
                    <button disabled={loading} type="submit" className="w-full h-16 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30">
                        {loading ? 'Validating Node...' : 'Authorize Node Synchronization'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
