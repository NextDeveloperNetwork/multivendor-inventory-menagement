'use client';

import { createProduct, createCategory, createUnit } from '@/app/actions/inventory';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Package, RefreshCw, AlertTriangle,
    Tag, DollarSign, Barcode, MapPin, ChevronDown, Activity, Plus,
} from 'lucide-react';
import Link from 'next/link';
import { generateBarcode, generateSKU } from '@/lib/utils';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NewProductClientProps {
    selectedBusinessId: string | null;
    currency: { symbol: string; code: string };
    shops: any[];
    warehouses: any[];
    categories: any[];
    units: any[];
}

export default function NewProductClient({ selectedBusinessId, currency, shops, warehouses, categories: initialCategories = [], units: initialUnits = [] }: NewProductClientProps) {
    const symbol = currency?.symbol || '$';
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [targetType, setTargetType] = useState<'warehouse' | 'shop'>('warehouse');
    const [targetId, setTargetId] = useState('');

    // New Dialog states
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [localCategories, setLocalCategories] = useState(initialCategories);
    const [localUnits, setLocalUnits] = useState(initialUnits);
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');
    const [isPriceEdited, setIsPriceEdited] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        if (selectedBusinessId) formData.append('businessId', selectedBusinessId);
        const res = await createProduct(formData);
        if (res.error) {
            const msg = typeof res.error === 'string' ? res.error : 'Validation failed';
            setError(msg);
            toast.error(msg);
            setLoading(false);
        } else {
            toast.success('Product created successfully');
            router.push('/admin/inventory');
            router.refresh();
        }
    };

    const inputCls = 'w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';
    const labelCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5';

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* ── Page Header ── */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/inventory"
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Product</h1>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Create a new article in the product catalog</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Main card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">

                    {/* Card header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Package size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">Product Details</span>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Product Name */}
                        <div className="space-y-1.5">
                            <label className={labelCls}><Tag size={10} /> Product Name *</label>
                            <input
                                name="name"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Blue Widget Pro"
                                className={inputCls + ' h-12 text-base font-semibold'}
                            />
                        </div>

                        {/* SKU + Barcode */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelCls}><Barcode size={10} /> SKU *</label>
                                <div className="relative">
                                    <input
                                        name="sku"
                                        required
                                        value={sku}
                                        onChange={e => setSku(e.target.value)}
                                        placeholder="SKU-0001"
                                        className={inputCls + ' pr-10 font-mono'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSku(generateSKU(name))}
                                        title="Auto-generate"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}><Barcode size={10} /> Barcode</label>
                                <div className="relative">
                                    <input
                                        name="barcode"
                                        value={barcode}
                                        onChange={e => setBarcode(e.target.value)}
                                        placeholder="EAN / UPC (optional)"
                                        className={inputCls + ' pr-10 font-mono'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setBarcode(generateBarcode())}
                                        title="Auto-generate"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category & Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelCls}><Tag size={10} /> Category</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            name="categoryId"
                                            className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                                        >
                                            <option value="">Select Category</option>
                                            {localCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryDialogOpen(true)}
                                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}><Activity size={10} /> Unit</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            name="unitId"
                                            className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                                        >
                                            <option value="">Select Unit</option>
                                            {localUnits.map(unit => (
                                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsUnitDialogOpen(true)}
                                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Description</label>
                            <textarea
                                name="description"
                                placeholder="Optional description or specifications…"
                                className="w-full px-3 py-3 h-24 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Pricing card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <DollarSign size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">Pricing</span>
                    </div>
                    <div className="px-6 py-5">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Selling price */}
                            <div className="space-y-1.5">
                                <label className={labelCls}>Selling Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">{symbol}</span>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price}
                                        onChange={e => {
                                            setPrice(e.target.value);
                                            setIsPriceEdited(true);
                                        }}
                                        placeholder="0.00 (Optional)"
                                        className={inputCls + ' pl-7 text-right font-mono'}
                                    />
                                </div>
                            </div>
                            {/* Cost */}
                            <div className="space-y-1.5">
                                <label className={labelCls}>Purchase Cost</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">{symbol}</span>
                                    <input
                                        name="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={cost}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setCost(val);
                                            if (!isPriceEdited && val) {
                                                const calc = (Number(val) * 1.4).toFixed(2);
                                                setPrice(calc);
                                            }
                                        }}
                                        placeholder="0.00 (Optional)"
                                        className={inputCls + ' pl-7 text-right font-mono'}
                                    />
                                </div>
                            </div>
                            {/* Discount */}
                            <div className="space-y-1.5">
                                <label className={labelCls}>Discount Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">{symbol}</span>
                                    <input
                                        name="discountPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="—"
                                        className={inputCls + ' pl-7 text-right font-mono'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Initial Stock card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center">
                            <MapPin size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900">Initial Stock</span>
                            <p className="text-[10px] text-slate-400 font-medium">Optional — set starting inventory</p>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        {/* Destination toggle */}
                        <div className="flex h-10 p-1 bg-slate-100 border border-slate-200 rounded-xl gap-1 w-48">
                            {(['warehouse', 'shop'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => { setTargetType(t); setTargetId(''); }}
                                    className={`flex-1 rounded-lg text-xs font-bold uppercase transition-all ${targetType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Qty */}
                            <div className="space-y-1.5">
                                <label className={labelCls}><Package size={10} /> Starting Qty</label>
                                <input
                                    name="initialStock"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className={inputCls + ' font-mono'}
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-1.5">
                                <label className={labelCls}>
                                    <MapPin size={10} /> {targetType === 'warehouse' ? 'Warehouse' : 'Shop'}
                                </label>
                                <div className="relative">
                                    <select
                                        name="targetId"
                                        value={targetId}
                                        onChange={e => setTargetId(e.target.value)}
                                        className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                                    >
                                        <option value="">None (skip)</option>
                                        {(targetType === 'warehouse' ? warehouses : shops).map(item => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <input type="hidden" name="targetType" value={targetType} />
                    </div>
                </div>

                {/* ── Image card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-900">Product Image</span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Optional</p>
                    </div>
                    <div className="px-6 py-5">
                        <ImageUpload value={imageUrl} onChange={setImageUrl} label="Upload product image" />
                        <input type="hidden" name="imageUrl" value={imageUrl} />
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex items-center justify-between pt-2">
                    <Link
                        href="/admin/inventory"
                        className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <><Activity size={16} className="animate-spin" /> Saving…</>
                        ) : (
                            <><Save size={16} /> Create Product</>
                        )}
                    </button>
                </div>
            </form>

            {/* ── Dialogs ── */}
            <CategoryUnitDialog
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                title="Add New Category"
                value={newCategoryName}
                onChange={setNewCategoryName}
                id="category_dialog"
                onAdd={async () => {
                    const res = await createCategory(newCategoryName, selectedBusinessId);
                    if (res.success) {
                        setLocalCategories([...localCategories, res.category]);
                        setNewCategoryName('');
                        setIsCategoryDialogOpen(false);
                        toast.success('Category added');
                    }
                }}
            />

            <CategoryUnitDialog
                isOpen={isUnitDialogOpen}
                onClose={() => setIsUnitDialogOpen(false)}
                title="Add New Unit"
                value={newUnitName}
                onChange={setNewUnitName}
                id="unit_dialog"
                onAdd={async () => {
                    const res = await createUnit(newUnitName, selectedBusinessId);
                    if (res.success) {
                        setLocalUnits([...localUnits, res.unit]);
                        setNewUnitName('');
                        setIsUnitDialogOpen(false);
                        toast.success('Unit added');
                    }
                }}
            />
        </div>
    );
}

function CategoryUnitDialog({ isOpen, onClose, title, value, onChange, onAdd, id }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white p-6 rounded-[2rem] border-none shadow-2xl overflow-hidden">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-mono italic">Name / Descriptor</label>
                        <input
                            autoFocus
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 italic"
                            placeholder="Type name..."
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all font-mono"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onAdd}
                            disabled={!value.trim()}
                            className="h-10 px-8 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shadow-lg active:scale-95 italic"
                        >
                            Create Item
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
