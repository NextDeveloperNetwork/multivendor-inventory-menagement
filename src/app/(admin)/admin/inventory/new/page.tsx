'use client';

import { createProduct } from '@/app/actions/inventory';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import MotionWrapper from '@/components/MotionWrapper';
import { generateEAN13 } from '@/lib/utils';

export default function NewProductPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [barcode, setBarcode] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await createProduct(formData);

        if (res.error) {
            if (typeof res.error === 'string') {
                setError(res.error);
            } else {
                setError("Validation failed");
            }
            setLoading(false);
        } else {
            router.push('/admin/inventory');
            router.refresh();
        }
    };

    return (
        <MotionWrapper className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/inventory" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900 shadow-sm">
                    <ArrowLeft size={20} className="stroke-[2.5]" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register Asset</h1>
                    <p className="text-slate-500 font-medium text-sm">Add a new item to the global master catalog.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/50">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Product Name</label>
                            <input name="name" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Wireless Mouse" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SKU (Identifier)</label>
                            <input name="sku" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. WM-001" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Barcode (Optional)</label>
                            <div className="relative group">
                                <input
                                    name="barcode"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all pr-12"
                                    placeholder="Scan or type barcode..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setBarcode(generateEAN13())}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Generate EAN-13"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <textarea name="description" className="w-full px-5 py-4 h-32 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none" placeholder="Detailed product specifications..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selling Price</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input name="price" type="number" step="0.01" min="0" required className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cost Price</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input name="cost" type="number" step="0.01" min="0" required className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Initial Stock</label>
                            <div className="relative">
                                <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input name="initialStock" type="number" min="0" className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <p className="text-xs text-blue-600 font-medium leading-relaxed">
                            <strong>Note:</strong> Initial stock will be distributed evenly or marked as global stock depending on configuration. Leave as 0 to add stock later via Stock Movements.
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-100 text-rose-600 font-bold text-sm flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <div className="p-6 border-t border-slate-100 flex justify-end gap-4">
                        <Link href="/admin/inventory" className="px-8 py-4 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </Link>
                        <button type="submit" disabled={loading} className="px-8 py-4 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-3">
                            {loading ? (
                                <span className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} className="stroke-[2.5]" />
                            )}
                            Save to Catalog
                        </button>
                    </div>
                </form>
            </div>
        </MotionWrapper>
    );
}
