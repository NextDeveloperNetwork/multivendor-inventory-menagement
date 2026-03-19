'use client';

import { useState } from 'react';
import { createProduct } from '@/app/actions/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, X, Activity, DollarSign, Tag, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

export default function QuickAddProductDialog({ onAdd }: { onAdd?: (product: any) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createProduct(formData);
        if (result.success) {
            toast.success('Product created');
            setOpen(false);
            setImageUrl('');
            if (onAdd) onAdd(result.product);
        } else {
            toast.error(result.error);
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
                    <Plus size={11} strokeWidth={3} /> New Product
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-md w-[95vw] p-0 gap-0 rounded-3xl overflow-hidden border-none shadow-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <DialogHeader className="bg-slate-900 px-6 py-5 flex-row items-center justify-between space-y-0 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Package size={18} className="text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-bold text-base tracking-tight">
                                Add New Product
                            </DialogTitle>
                            <p className="text-slate-400 text-[10px] mt-0.5">Create a new catalog item</p>
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
                <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto flex-1 bg-white">
                    <div className="px-6 py-5 space-y-4">

                        {/* Product Name */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Tag size={10} /> Product Name
                            </label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. Blue Widget Pro"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>

                        {/* SKU + Barcode */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Barcode size={10} /> SKU
                                </label>
                                <input
                                    name="sku"
                                    required
                                    placeholder="SKU-0001"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Barcode size={10} /> Barcode
                                </label>
                                <input
                                    name="barcode"
                                    placeholder="Optional"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <DollarSign size={10} /> Cost
                                </label>
                                <input
                                    name="cost"
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-right"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <DollarSign size={10} /> Price
                                </label>
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-right"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <DollarSign size={10} /> Discount
                                </label>
                                <input
                                    name="discountPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder="—"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-right"
                                />
                            </div>
                        </div>

                        {/* Image */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Product Image (optional)
                            </label>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                <ImageUpload value={imageUrl} onChange={setImageUrl} label="Upload image" />
                                <input type="hidden" name="imageUrl" value={imageUrl} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
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
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? (
                                <><Activity size={15} className="animate-spin" /> Saving…</>
                            ) : (
                                <><Package size={15} /> Create Product</>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
