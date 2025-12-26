'use client';

import { useState } from 'react';
import { createProduct } from '@/app/actions/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickAddProductDialog({ onAdd }: { onAdd?: (product: any) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = await createProduct(formData);
        if (result.success) {
            toast.success('Product created successfully');
            setOpen(false);
            if (onAdd) onAdd(result.product);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="text-[10px] font-black text-blue-500 bg-white border border-blue-100 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all uppercase flex items-center gap-2">
                    <Plus size={12} /> New Asset
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <div className="bg-black p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <Package className="text-blue-500" /> Genesis Entry
                        </DialogTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Create New Article Identifier</p>
                    </DialogHeader>
                </div>
                <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Product Name</label>
                        <input name="name" required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="e.g. Titan Frame X1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">SKU / ID</label>
                            <input name="sku" required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="SKU-XXXX" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Base Cost</label>
                            <input name="cost" type="number" step="0.01" required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Selling Price (MSRP)</label>
                            <input name="price" type="number" step="0.01" required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Discount Price</label>
                            <input name="discountPrice" type="number" step="0.01" className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-black outline-none focus:border-blue-400" placeholder="Optional" />
                        </div>
                    </div>
                    <button disabled={loading} type="submit" className="w-full h-16 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30">
                        {loading ? 'Initializing...' : 'Authorize Article Creation'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
