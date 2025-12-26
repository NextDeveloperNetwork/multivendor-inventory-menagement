'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProduct, updateProduct, quickAddStock } from '@/app/actions/inventory';
import {
    Plus,
    Search,
    Trash2,
    Settings2,
    Package,
    TrendingUp,
    ShieldCheck,
    ArrowRight,
    Loader2,
    X,
    Save,
    AlertCircle,
    Camera,
    RefreshCw,
    Minus,
    Copy,
    Barcode
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, generateEAN13 } from '@/lib/utils';
import BarcodeScanner from './BarcodeScanner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import ProductHistoryDialog from './ProductHistoryDialog';

interface InventoryClientProps {
    products: any[];
    filter: string;
    shopId?: string;
    warehouseId?: string;
    currency: { symbol: string; rate: number };
}

export default function InventoryClient({ products: initialProducts, filter, shopId, warehouseId, currency }: InventoryClientProps) {
    const symbol = currency?.symbol || '$';

    const [search, setSearch] = useState('');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [historyProduct, setHistoryProduct] = useState<any>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const filteredProducts = initialProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    const handleDelete = async () => {
        if (!productToDelete) return;
        setLoading(true);
        const res = await deleteProduct(productToDelete.id);
        if (res.success) {
            toast.success('Product deleted successfully');
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = await updateProduct(editingProduct.id, formData);
        if (res.success) {
            toast.success('Product updated successfully');
            setEditingProduct(null);
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="flex gap-4 max-w-xl mx-auto xl:mx-0">
                <div className="relative group flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search global assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-16 pl-16 pr-6 bg-white border-2 border-slate-100 rounded-[1.5rem] font-bold text-black focus:border-blue-400 outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                </div>
                <button
                    onClick={() => setShowScanner(true)}
                    className="h-16 px-6 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Camera size={24} />
                    <span className="hidden sm:inline font-black uppercase text-[10px] tracking-widest">Scan</span>
                </button>
            </div>

            <div className="hidden md:block bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Component / identifier</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Valuation</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Unit Cost</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Stock</th>
                                <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Command</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProducts.map((product) => {
                                let stock = 0;
                                if (filter === 'all') {
                                    stock = product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                                } else if (filter === 'warehouse') {
                                    stock = product.inventory
                                        .filter((inv: any) => inv.warehouseId !== null)
                                        .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                                } else if (filter === 'shops') {
                                    stock = product.inventory
                                        .filter((inv: any) => inv.shopId !== null)
                                        .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                                } else if (filter === 'specific_shop' && shopId) {
                                    stock = product.inventory
                                        .filter((inv: any) => inv.shopId === shopId)
                                        .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                                } else if (filter === 'specific_warehouse' && warehouseId) {
                                    stock = product.inventory
                                        .filter((inv: any) => inv.warehouseId === warehouseId)
                                        .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                                }

                                return (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-10 py-8">
                                            <button
                                                onClick={() => setHistoryProduct(product)}
                                                className="flex items-center gap-4 text-left group/name"
                                            >
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-black uppercase tracking-tight italic text-base group-hover/name:text-blue-600 transition-colors underline decoration-transparent group-hover/name:decoration-blue-200 underline-offset-4">{product.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">SKU: {product.sku}</div>
                                                        {product.barcode && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md border border-blue-100">
                                                                <Barcode size={10} />
                                                                <span className="text-[8px] font-black font-mono">{product.barcode}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigator.clipboard.writeText(product.barcode);
                                                                        toast.success('Barcode Copied: ' + product.barcode);
                                                                    }}
                                                                    className="hover:text-blue-700 transition-colors"
                                                                    title="Copy Barcode"
                                                                >
                                                                    <Copy size={10} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="text-black font-black text-lg font-mono tracking-tighter italic">{formatCurrency(product.price, symbol)}</div>
                                            <div className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1 italic">Selling Price</div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="text-slate-900 font-black text-xs font-mono tracking-widest italic">{formatCurrency(product.cost, symbol)}</div>
                                            <div className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1 italic">Weighted Avg Cost</div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={`inline-flex px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${stock > 10 ? 'bg-white text-blue-600 border-blue-100' :
                                                stock > 0 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-black text-white border-black'
                                                }`}>
                                                {stock} Units
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform translate-x-0 lg:translate-x-4 lg:group-hover:translate-x-0">
                                                {product.barcode && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(product.barcode);
                                                            toast.success('Barcode Copied: ' + product.barcode);
                                                        }}
                                                        className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 transition-all shadow-sm"
                                                        title="Copy Barcode"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setEditingProduct(product)}
                                                    className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                                                >
                                                    <Settings2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setProductToDelete(product);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-400 transition-all shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredProducts.map((product) => {
                    let stock = 0;
                    if (filter === 'all') {
                        stock = product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                    } else if (filter === 'warehouse') {
                        stock = product.inventory
                            .filter((inv: any) => inv.warehouseId !== null)
                            .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                    } else if (filter === 'shops') {
                        stock = product.inventory
                            .filter((inv: any) => inv.shopId !== null)
                            .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                    } else if (filter === 'specific_shop' && shopId) {
                        stock = product.inventory
                            .filter((inv: any) => inv.shopId === shopId)
                            .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                    } else if (filter === 'specific_warehouse' && warehouseId) {
                        stock = product.inventory
                            .filter((inv: any) => inv.warehouseId === warehouseId)
                            .reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                    }

                    return (
                        <div key={product.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner shrink-0">
                                        <Package size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-900 text-lg leading-tight truncate">{product.name}</div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <div className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">SKU: {product.sku}</div>
                                            {product.barcode && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(product.barcode);
                                                        toast.success('Barcode Copied: ' + product.barcode);
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md border border-blue-100"
                                                >
                                                    <Barcode size={10} />
                                                    <span className="text-[8px] font-black font-mono">{product.barcode}</span>
                                                    <Copy size={8} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0 ${stock > 10 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    stock > 0 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        'bg-black text-white border-black'
                                    }`}>
                                    {stock} Units
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                <div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Price</div>
                                    <div className="font-mono font-black text-slate-900 text-lg">{formatCurrency(product.price, symbol)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Cost</div>
                                    <div className="font-mono font-black text-slate-900 text-lg">{formatCurrency(product.cost, symbol)}</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {product.barcode && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(product.barcode);
                                            toast.success('Barcode Copied: ' + product.barcode);
                                        }}
                                        className="flex-1 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border-2 border-transparent hover:border-blue-200 transition-all gap-2"
                                    >
                                        <Copy size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Copy</span>
                                    </button>
                                )}
                                <button onClick={() => setEditingProduct(product)} className="flex-1 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all">
                                    Config
                                </button>
                                <button onClick={() => { setProductToDelete(product); setIsDeleteDialogOpen(true); }} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl border-2 border-transparent hover:border-red-200 transition-all">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] bg-white rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-black p-10 text-white flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Settings2 size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Modify Asset</DialogTitle>
                                <DialogDescription className="text-[10px] font-black text-blue-400 uppercase tracking-widest">System Master Update</DialogDescription>
                            </div>
                        </div>
                        <button onClick={() => setEditingProduct(null)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleUpdate} className="p-10 space-y-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Product Name</label>
                                <input name="name" defaultValue={editingProduct?.name} required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Global SKU</label>
                                <input name="sku" defaultValue={editingProduct?.sku} required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Barcode (Master Identifier)</label>
                            <div className="relative group">
                                <input
                                    name="barcode"
                                    defaultValue={editingProduct?.barcode}
                                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs pr-12"
                                    placeholder="Universal Barcode Reference..."
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        if (input) input.value = generateEAN13();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Generate EAN-13"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telemetry Description</label>
                            <textarea name="description" defaultValue={editingProduct?.description} className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs resize-none" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Customer Price (USD)</label>
                                <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs font-mono" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Discount Price (USD)</label>
                                <input name="discountPrice" type="number" step="0.01" defaultValue={editingProduct?.discountPrice} className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs font-mono" placeholder="Optional" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Acquisition Cost (USD)</label>
                                <input name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-black focus:border-blue-400 focus:bg-white outline-none transition-all text-xs font-mono" />
                            </div>
                        </div>

                        {/* Inventory Quantities Section */}
                        {editingProduct?.inventory && editingProduct.inventory.length > 0 && (
                            <div className="space-y-4 pt-4 border-t-2 border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Inventory Levels</label>
                                <div className="space-y-3">
                                    {editingProduct.inventory.map((inv: any) => {
                                        const locationName = inv.shop?.name || inv.warehouse?.name || 'Unknown Location';
                                        const locationType = inv.shopId ? 'Shop' : 'Warehouse';
                                        const locationId = inv.shopId || inv.warehouseId;

                                        return (
                                            <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                                                <div className="flex-1">
                                                    <div className="font-bold text-black text-sm">{locationName}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{locationType}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center px-4">
                                                        <div className="text-2xl font-black text-black font-mono">{inv.quantity}</div>
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase">Units</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!locationId) return;
                                                                setLoading(true);
                                                                const res = await quickAddStock(editingProduct.id, -1, locationId);
                                                                if (res.success) {
                                                                    toast.success('Quantity decreased');
                                                                    router.refresh();
                                                                    // Update local state
                                                                    const updated = { ...editingProduct };
                                                                    const invIndex = updated.inventory.findIndex((i: any) => i.id === inv.id);
                                                                    if (invIndex !== -1) {
                                                                        updated.inventory[invIndex].quantity = Math.max(0, updated.inventory[invIndex].quantity - 1);
                                                                        setEditingProduct(updated);
                                                                    }
                                                                } else {
                                                                    toast.error(res.error || 'Failed to adjust quantity');
                                                                }
                                                                setLoading(false);
                                                            }}
                                                            disabled={loading || inv.quantity === 0}
                                                            className="w-10 h-10 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all shadow-sm border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!locationId) return;
                                                                setLoading(true);
                                                                const res = await quickAddStock(editingProduct.id, 1, locationId);
                                                                if (res.success) {
                                                                    toast.success('Quantity increased');
                                                                    router.refresh();
                                                                    // Update local state
                                                                    const updated = { ...editingProduct };
                                                                    const invIndex = updated.inventory.findIndex((i: any) => i.id === inv.id);
                                                                    if (invIndex !== -1) {
                                                                        updated.inventory[invIndex].quantity += 1;
                                                                        setEditingProduct(updated);
                                                                    }
                                                                } else {
                                                                    toast.error(res.error || 'Failed to adjust quantity');
                                                                }
                                                                setLoading(false);
                                                            }}
                                                            disabled={loading}
                                                            className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-lg hover:bg-emerald-100 transition-all shadow-sm border border-emerald-100 flex items-center justify-center"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 h-16 border-2 border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                                Abort Changes
                            </button>
                            <button disabled={loading} type="submit" className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3">
                                {loading && <Loader2 className="animate-spin" size={16} />}
                                Persist System Data
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-10 border-none shadow-2xl">
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertCircle size={40} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">Authorize Item Deletion?</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-4">Warning: This action will purge all telemetry for <span className="text-red-500">{productToDelete?.name}</span> from the master registry.</DialogDescription>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 h-14 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">
                                Negative
                            </button>
                            <button onClick={handleDelete} disabled={loading} className="flex-1 h-14 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-3">
                                {loading && <Loader2 className="animate-spin" size={14} />}
                                Confirm Purge
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ProductHistoryDialog
                product={historyProduct}
                isOpen={!!historyProduct}
                onClose={() => setHistoryProduct(null)}
            />

            {showScanner && (
                <BarcodeScanner
                    onScan={(code) => {
                        setSearch(code);
                        setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
