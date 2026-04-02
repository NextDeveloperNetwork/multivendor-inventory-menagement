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

            <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                {/* Header Section */}
                <DialogHeader className="bg-white px-8 py-6 flex-row items-center justify-between space-y-0 shrink-0 border-b border-slate-100">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
                            <Plus size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-slate-900 font-serif text-2xl tracking-tight leading-none italic uppercase">
                                New Asset
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black italic">Catalog Deployment</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto max-h-[75vh] bg-white">
                    <div className="px-8 py-8 space-y-6">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <Tag size={12} className="text-slate-900" /> Descriptor Identity
                            </label>
                            <input
                                name="name"
                                required
                                placeholder="PRO_ARTICLE_NAME"
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm placeholder:text-slate-300 placeholder:italic uppercase"
                            />
                        </div>

                        {/* SKU + Barcode */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                    <Barcode size={12} className="text-slate-900" /> Stock_UID
                                </label>
                                <input
                                    name="sku"
                                    placeholder="SKU_REF"
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm font-mono uppercase placeholder:text-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                    <Barcode size={12} className="text-slate-900" /> Global_BCD
                                </label>
                                <input
                                    name="barcode"
                                    placeholder="OPTIONAL"
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm font-mono uppercase placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Valuation Logic */}
                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                                <DollarSign size={10} className="text-slate-900" /> Capital Valuation Logic
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Acq_Cost</p>
                                    <input
                                        name="cost"
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm tabular-nums text-right"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Target_Val</p>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm tabular-nums text-right"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Disc_Offset</p>
                                    <input
                                        name="discountPrice"
                                        type="number"
                                        step="0.01"
                                        placeholder="NULL"
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm tabular-nums text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Imagery */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Visual Identity Reference</label>
                            <div className="bg-white border-2 border-dashed border-slate-100 rounded-2xl p-6 hover:border-slate-300 transition-all group">
                                <ImageUpload value={imageUrl} onChange={setImageUrl} label="Upload Image Manifest" />
                                <input type="hidden" name="imageUrl" value={imageUrl} />
                            </div>
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                        >
                            Abort_Action
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-8 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-slate-900/10"
                        >
                            {loading ? (
                                <><Activity size={14} className="animate-spin" /> Finalizing...</>
                            ) : (
                                <><Package size={14} /> Commit Entry</>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
