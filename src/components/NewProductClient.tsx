'use client';

import { createProduct } from '@/app/actions/inventory';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import MotionWrapper from '@/components/MotionWrapper';
import { generateBarcode, generateSKU } from '@/lib/utils';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

interface NewProductClientProps {
    selectedBusinessId: string | null;
    currency: { symbol: string; code: string };
}

export default function NewProductClient({ selectedBusinessId, currency }: NewProductClientProps) {
    const symbol = currency?.symbol || '$';
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        if (selectedBusinessId) {
            formData.append('businessId', selectedBusinessId);
        }

        const res = await createProduct(formData);

        if (res.error) {
            if (typeof res.error === 'string') {
                setError(res.error);
                toast.error(res.error);
            } else {
                setError("Validation failed");
                toast.error("Validation failed");
            }
            setLoading(false);
        } else {
            toast.success("Product created successfully");
            router.push('/admin/inventory');
            router.refresh();
        }
    };

    return (
        <MotionWrapper className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/inventory" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900 shadow-sm">
                        <ArrowLeft size={20} className="stroke-[2.5]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Catalog <span className="text-primary">Genesis</span></h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 italic">
                            <Package size={14} className="text-primary" /> Initializing new article identifier in master registry
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Visuals & Core ID */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Image Upload System */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <ImageUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            label="Product Aesthetic"
                            description="Capture imagery via camera or select from archives. Native camera support included."
                        />
                        <input type="hidden" name="imageUrl" value={imageUrl} />
                    </div>

                    {/* Core Identifiers */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic text-primary">Master SKU</label>
                            <div className="relative group/input">
                                <input
                                    name="sku"
                                    required
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all uppercase italic tracking-tighter pr-14"
                                    placeholder="XXXX-ID-001"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSku(generateSKU(name))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center group-hover/input:scale-105 active:scale-95"
                                    title="Generate SKU"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Barcode Entropy</label>
                            <div className="relative group/input">
                                <input
                                    name="barcode"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all pr-14 font-mono"
                                    placeholder="Enter or generate stream..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setBarcode(generateBarcode())}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center group-hover/input:scale-105 active:scale-95"
                                    title="Generate EAN-13"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Pricing */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Article Designation</label>
                            <input
                                name="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all tracking-tighter uppercase italic"
                                placeholder="Enter product name..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Functional Category</label>
                                <input name="category" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all italic" placeholder="e.g. Hardware" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Status</label>
                                <div className="h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Registry</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Spectral Parameters (Description)</label>
                            <textarea name="description" className="w-full px-8 py-6 h-40 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all resize-none leading-relaxed" placeholder="Detailed product specifications and technical requirements..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 italic">Liquidated Price</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black italic">{symbol}</span>
                                    <input name="price" type="number" step="0.01" min="0" required className="w-full pl-10 pr-6 py-5 bg-slate-900 text-white rounded-2xl text-xl font-black font-mono focus:ring-2 ring-primary/20 outline-none transition-all italic tracking-tighter" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest pl-1 italic">Discount Price</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 font-bold italic">{symbol}</span>
                                    <input name="discountPrice" type="number" step="0.01" min="0" className="w-full pl-10 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all italic tracking-tighter font-mono" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Procurement Cost</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold italic">{symbol}</span>
                                    <input name="cost" type="number" step="0.01" min="0" required className="w-full pl-10 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all italic tracking-tighter font-mono" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Initial Stock</label>
                                <div className="relative">
                                    <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input name="initialStock" type="number" min="0" className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all italic tracking-tighter font-mono" placeholder="0" />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-600 font-black text-xs flex items-center gap-4 uppercase tracking-widest italic animate-in slide-in-from-top-4">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                System Error: {error}
                            </div>
                        )}

                        <div className="pt-10 flex justify-end gap-6 border-t border-slate-50">
                            <Link href="/admin/inventory" className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors italic">
                                Terminate Session
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-16 px-12 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center gap-4 italic"
                            >
                                {loading ? (
                                    <span className="block w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} className="stroke-[3]" />
                                )}
                                Authorize Entry
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </MotionWrapper>
    );
}
