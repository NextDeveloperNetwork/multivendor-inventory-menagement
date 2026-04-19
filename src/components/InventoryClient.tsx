'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProduct, updateProduct, quickAddStock, setStockLevel, bulkDeleteProducts } from '@/app/actions/inventory';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Settings2,
    Package,
    Activity,
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
    Barcode,
    AlertTriangle,
    LayoutGrid,
    List,
    HelpCircle,
    Image as ImageIcon,
    CheckSquare,
    Square,
    Printer,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import BarcodePrintDialog from './barcode/BarcodePrintDialog';
import { toast } from 'sonner';
import { logActivity } from '@/app/actions/intelligence';
import ImageUpload from './ImageUpload';
import { formatCurrency, generateBarcode, generateSKU } from '@/lib/utils';
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
    currency: { symbol: string; rate: number; code?: string };
    categories?: any[];
    activeCategoryId?: string;
}

export default function InventoryClient({ products: initialProducts, filter, shopId, warehouseId, currency, categories = [], activeCategoryId }: InventoryClientProps) {
    const symbol = currency?.symbol || '$';
    const currencyCode = currency?.code || 'USD';

    const [search, setSearch] = useState('');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [localEditProduct, setLocalEditProduct] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [historyProduct, setHistoryProduct] = useState<any>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'catalog'>('table');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [printProduct, setPrintProduct] = useState<any>(null);
    const [sortField, setSortField] = useState<'name' | 'stock'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const router = useRouter();

    const openEditDialog = (product: any) => {
        setLocalEditProduct({ ...product });
        setEditingProduct(product);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingProduct) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = await updateProduct(editingProduct.id, formData);
        if (res.success) {
            toast.success('Product updated successfully');
            setEditingProduct(null);
            setLocalEditProduct(null);
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const filteredProducts = initialProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    const getStock = (product: any) => {
        if (filter === 'all') {
            return product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
        } else if (filter === 'warehouse') {
            return product.inventory.filter((inv: any) => inv.warehouseId !== null).reduce((sum: number, inv: any) => sum + inv.quantity, 0);
        } else if (filter === 'shops') {
            return product.inventory.filter((inv: any) => inv.shopId !== null).reduce((sum: number, inv: any) => sum + inv.quantity, 0);
        } else if (filter === 'specific_shop' && shopId) {
            return product.inventory.filter((inv: any) => inv.shopId === shopId).reduce((sum: number, inv: any) => sum + inv.quantity, 0);
        } else if (filter === 'specific_warehouse' && warehouseId) {
            return product.inventory.filter((inv: any) => inv.warehouseId === warehouseId).reduce((sum: number, inv: any) => sum + inv.quantity, 0);
        }
        return 0;
    };

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let valA: any, valB: any;
        if (sortField === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else {
            valA = getStock(a);
            valB = getStock(b);
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSort = (field: 'name' | 'stock') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleReportDamage = async (product: any) => {
        const amount = window.prompt(`How many units of ${product.name} are damaged?`);
        if (!amount) return;

        const qty = parseInt(amount);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Invalid quantity');
            return;
        }

        try {
            await logActivity({
                action: 'DAMAGED_REPORTED',
                entityType: 'PRODUCT',
                entityId: product.id,
                details: `DAMAGE NOTICE: ${qty} units of ${product.sku} marked as damaged/unsellable.`
            });
            toast.success(`Damage reported for ${qty} units. Audit log created.`, {
                icon: <AlertTriangle className="text-amber-500" />
            });
        } catch (e) {
            toast.error('Log failure');
        }
    };

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

    const toggleProductSelection = (productId: string) => {
        const newSelection = new Set(selectedProducts);
        if (newSelection.has(productId)) {
            newSelection.delete(productId);
        } else {
            newSelection.add(productId);
        }
        setSelectedProducts(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;
        setLoading(true);
        const res = await bulkDeleteProducts(Array.from(selectedProducts));
        if (res.success) {
            toast.success(`Successfully deleted ${res.count} product(s)`);
            setSelectedProducts(new Set());
            setIsDeleteDialogOpen(false);
            router.refresh();
        } else {
            toast.error(res.error || 'Failed to delete products');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                        <button
                            onClick={() => setViewMode('catalog')}
                            className={`px-4 h-8 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <LayoutGrid size={14} />
                            <span>Catalog</span>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 h-8 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <List size={14} />
                            <span>List View</span>
                        </button>
                    </div>

                    <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

                    <button
                        onClick={() => setShowScanner(true)}
                        className="h-10 px-4 bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <Camera size={14} className="text-blue-600" />
                        Scan Barcode
                    </button>

                    {selectedProducts.size > 0 && (
                        <button
                            onClick={() => {
                                setProductToDelete({ isBulk: true, count: selectedProducts.size });
                                setIsDeleteDialogOpen(true);
                            }}
                            className="h-10 px-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                        >
                            <Trash2 size={14} />
                            Delete ({selectedProducts.size})
                        </button>
                    )}

                    {/* Category Filter Dropdown */}
                    <div className="relative group min-w-[160px]">
                        <label className="absolute -top-2 left-3 bg-white px-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10 font-mono italic">FILTER_BY_CATEGORY</label>
                        <select
                            value={activeCategoryId || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                const url = new URL(window.location.href);
                                if (val) url.searchParams.set('categoryId', val);
                                else url.searchParams.delete('categoryId');
                                router.push(url.toString());
                            }}
                            className="w-full h-10 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 appearance-none focus:border-blue-600 hover:border-slate-300 transition-all outline-none cursor-pointer italic"
                        >
                            <option value="">ALL_DEPARTMENTS</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <Settings2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>
                </div>

                <div className="relative group w-full lg:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search inventory records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-900"
                    />
                </div>
            </div>

            {viewMode === 'table' ? (
                <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 w-10">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors"
                                        >
                                            {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                                                <CheckSquare size={16} className="text-blue-600" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">
                                        <button 
                                            onClick={() => toggleSort('name')}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic hover:text-blue-600 transition-colors"
                                        >
                                            Asset Designation
                                            {sortField === 'name' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Category / Unit</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Cost</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Price</th>
                                    <th className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => toggleSort('stock')}
                                            className="flex items-center gap-2 ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic hover:text-blue-600 transition-colors"
                                        >
                                            Inventory Level
                                            {sortField === 'stock' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedProducts.map((product) => {
                                    const stock = getStock(product);

                                    const isSelected = selectedProducts.has(product.id);

                                    return (
                                        <tr
                                            key={product.id}
                                            className={`group cursor-pointer hover:bg-blue-50 transition-all h-16 border-b border-slate-100 last:border-0 ${isSelected ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => toggleProductSelection(product.id)}
                                        >
                                            <td className="px-6" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => toggleProductSelection(product.id)}
                                                    className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                                                >
                                                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all overflow-hidden shrink-0 shadow-sm">
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={14} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-black text-slate-900 text-[11px] uppercase tracking-tight truncate max-w-[220px]">{product.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] text-slate-500 font-bold font-mono tracking-tighter italic">SKU_{product.sku}</span>
                                                            {product.barcode && (
                                                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-white transition-colors">
                                                                    <Barcode size={10} />
                                                                    <span className="font-mono">{product.barcode}</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigator.clipboard.writeText(product.barcode);
                                                                            toast.success('ID Copied');
                                                                        }}
                                                                        className="ml-1 hover:text-blue-600 transition-colors"
                                                                        title="Copy Identifier"
                                                                    >
                                                                        <Copy size={10} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter italic">{(product as any).category?.name || 'Uncategorized'}</span>
                                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{(product as any).unit?.name || 'Standard Unit'}</span>
                                                </div>
                                            </td>
                                             <td className="px-6 text-right">
                                                <div className="text-slate-500 font-black text-xs font-mono tracking-tighter italic">{formatCurrency(product.cost, symbol)}</div>
                                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic leading-none">Unit Cost</div>
                                            </td>
                                            <td className="px-6 text-right">
                                                <div className="text-slate-900 font-black text-xs font-mono tracking-tighter italic">{formatCurrency(product.price, symbol)}</div>
                                                <div className="text-[8px] text-blue-600 font-bold uppercase tracking-widest mt-0.5 italic leading-none">Listed Price</div>
                                            </td>
                                            <td className="px-6 text-right">
                                                <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border shadow-sm font-mono italic ${stock > 10 ? 'bg-white text-emerald-600 border-emerald-100' :
                                                    stock > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-900 text-white border-slate-900'
                                                    }`}>
                                                    {stock} Units
                                                </div>
                                            </td>
                                            <td className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setPrintProduct(product)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all font-mono shadow-sm"
                                                        title="Print Product"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditDialog(product)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all font-mono shadow-sm"
                                                        title="Config"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setHistoryProduct(product)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all font-mono shadow-sm"
                                                        title="Ledger"
                                                    >
                                                        <Activity size={16} />
                                                    </button>
                                                    <div className="h-4 w-px bg-slate-200 mx-1" />
                                                    <button
                                                        onClick={() => {
                                                            setProductToDelete(product);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all font-mono shadow-sm"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={16} />
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
            ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedProducts.map((product) => {
                        const stock = getStock(product);

                        return (
                            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-600/50 transition-all group/card flex flex-col">
                                <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <ImageIcon size={40} strokeWidth={1} />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic">NO_VISUAL_DATA</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-1.5 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all">
                                        <button onClick={() => openEditDialog(product)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-700 hover:text-blue-600 shadow-lg transition-transform active:scale-90">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => setPrintProduct(product)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-700 hover:text-blue-600 shadow-lg transition-transform active:scale-90" title="Print Barcode">
                                            <Printer size={14} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setProductToDelete(product);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-700 hover:text-rose-600 shadow-lg transition-transform active:scale-90"
                                            title="Remove Product"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-lg ${stock > 10 ? 'bg-white text-blue-600 border-blue-100' :
                                            stock > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-slate-900 text-white border-slate-900'
                                            }`}>
                                            {stock} Units
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-black text-slate-900 text-[11px] tracking-tight uppercase italic group-hover/card:text-blue-600 transition-colors truncate leading-tight">{product.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[7px] text-slate-400 font-black font-mono uppercase tracking-[0.2em] italic">SKU_{product.sku}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-mono font-black text-slate-900 text-xs tracking-tighter italic">{formatCurrency(product.price, symbol)}</div>
                                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">{formatCurrency(product.cost, symbol)} <span className="opacity-50">COST</span></div>
                                            <div className="text-[8px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">{(product as any).unit?.name || 'U'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest italic">{(product as any).category?.name || 'GENERAL'}</span>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                                         <button onClick={() => setHistoryProduct(product)} className="text-[8px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1.5 uppercase tracking-widest transition-colors italic">
                                             <Activity size={12} />
                                             <span>STOCK_HISTORY</span>
                                         </button>
                                         <button onClick={() => handleReportDamage(product)} className="text-[8px] font-black text-slate-400 hover:text-rose-500 flex items-center gap-1.5 uppercase tracking-widest transition-colors italic">
                                             <AlertTriangle size={12} />
                                             <span>LOSS_REPORT</span>
                                         </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {sortedProducts.map((product) => {
                    const stock = getStock(product);

                    return (
                        <div key={product.id} className="bg-white p-5 rounded-3xl border border-slate-300 shadow-sm space-y-5">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 overflow-hidden">
                                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-900 text-sm leading-tight truncate uppercase italic">{product.name}</div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <div className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest">SKU: {product.sku}</div>
                                            <div className="text-[9px] text-blue-600 font-bold uppercase tracking-widest italic border-l pl-2 border-slate-200">{product.category?.name || 'GEN'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 pb-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0 ${stock > 10 ? 'bg-white text-blue-600 border-blue-200' :
                                    stock > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                        'bg-slate-900 text-white border-slate-900'
                                    }`}>
                                    {stock} U
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                <div>
                                    <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Price</div>
                                    <div className="font-mono font-black text-slate-900 text-base italic">{formatCurrency(product.price, symbol)}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Cost</div>
                                    <div className="font-mono font-black text-slate-700 text-xs italic">{formatCurrency(product.cost, symbol)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => setPrintProduct(product)}
                                    className="h-9 flex items-center justify-center bg-white text-slate-400 rounded-lg border border-slate-200 hover:text-blue-600 transition-all font-black text-[8px] uppercase tracking-widest italic"
                                >
                                    <Printer size={14} />
                                </button>
                                <button onClick={() => openEditDialog(product)} className="col-span-2 h-9 flex items-center justify-center bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all italic border border-slate-800">
                                    Edit Product Details
                                </button>
                                <button onClick={() => { setProductToDelete(product); setIsDeleteDialogOpen(true); }} className="h-9 flex items-center justify-center bg-white text-slate-400 rounded-lg border border-slate-200 hover:text-rose-600 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => { if(!open) { setEditingProduct(null); setLocalEditProduct(null); } }}>
                <DialogContent className="max-w-3xl max-h-[95vh] bg-white rounded-2xl p-0 overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
                    <DialogHeader className="bg-white px-10 py-8 text-slate-900 flex flex-row justify-between items-center border-b border-slate-100 shrink-0 space-y-0">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <Settings2 size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 font-serif text-2xl tracking-tight leading-none">
                                    Asset Management
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-semibold">
                                    Inventory Registry Maintenance
                                </DialogDescription>
                            </div>
                        </div>
                        <button onClick={() => { setEditingProduct(null); setLocalEditProduct(null); }} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200 shadow-sm">
                            <X size={20} />
                        </button>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">01. Asset Designation</label>
                                <input name="name" defaultValue={localEditProduct?.name} required className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all placeholder:text-slate-300" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">02. Stock Keeping Unit (SKU)</label>
                                <div className="relative group">
                                    <input
                                        name="sku"
                                        defaultValue={localEditProduct?.sku}
                                        required
                                        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all pr-14 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            const nameInput = input.closest('form')?.querySelector('input[name="name"]') as HTMLInputElement;
                                            if (input) input.value = generateSKU(nameInput?.value || '');
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">03. Department/Category</label>
                                <input name="categoryName" defaultValue={(localEditProduct as any)?.category?.name} className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all placeholder:text-slate-400" placeholder="GENERAL STORE" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">04. Measurement Unit</label>
                                <input name="unitName" defaultValue={(localEditProduct as any)?.unit?.name} className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all placeholder:text-slate-400" placeholder="STANDARD UNIT" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">05. Reference ID (Barcode)</label>
                            <div className="relative group">
                                <input
                                    name="barcode"
                                    defaultValue={localEditProduct?.barcode}
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all pr-14 font-mono"
                                    placeholder="REFERENCE..."
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        if (input) input.value = generateBarcode();
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">06. Purchase Cost (Unit)</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{symbol}</div>
                                    <input
                                        type="number" step="0.01" name="cost"
                                        value={localEditProduct?.cost?.toString() || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalEditProduct((prev: any) => {
                                                if (!prev) return null;
                                                const next = { ...prev, cost: val as any };
                                                if (!next.isPriceManual) {
                                                    next.price = (parseFloat(val || '0') * 1.4).toFixed(2) as any;
                                                }
                                                return next;
                                            });
                                        }}
                                        className="w-full h-12 pl-12 pr-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none tabular-nums font-mono italic"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] flex items-center justify-between">
                                    <span>07. Unit Sale Price</span>
                                    {localEditProduct?.isPriceManual ? (
                                        <span className="bg-slate-900 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black tracking-widest leading-none">FIXED_PRICE</span>
                                    ) : (
                                        <span className="bg-emerald-100 text-emerald-700 text-[7px] px-1.5 py-0.5 rounded-full font-black tracking-widest leading-none">AUTO_CALC</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{symbol}</div>
                                    <input
                                        type="number" step="0.01" name="price"
                                        value={localEditProduct?.price?.toString() || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalEditProduct((prev: any) => {
                                                if (!prev) return null;
                                                return { ...prev, price: val as any, isPriceManual: true };
                                            });
                                        }}
                                        className="w-full h-12 pl-12 pr-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none tabular-nums font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inventory Quantities Section */}
                        {editingProduct?.inventory && editingProduct.inventory.length > 0 && (
                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono italic">LOCATION_STOCK_DISTRIBUTION</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {editingProduct.inventory.map((inv: any) => {
                                        const locationName = inv.shop?.name || inv.warehouse?.name || 'Unknown';
                                        const locationType = inv.shopId ? 'SHOP' : 'WHSE';
                                        const locationId = inv.shopId || inv.warehouseId;

                                        return (
                                            <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="min-w-0">
                                                    <div className="font-black text-slate-900 text-[10px] truncate uppercase italic">{locationName}</div>
                                                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono mt-0.5">{locationType}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        value={inv.quantity}
                                                        onChange={async (e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (isNaN(val) || val < 0) return;
                                                            const updated = { ...localEditProduct };
                                                            const invIndex = updated.inventory.findIndex((i: any) => i.id === inv.id);
                                                            if (invIndex !== -1) {
                                                                updated.inventory[invIndex].quantity = val;
                                                                setEditingProduct(updated);
                                                                setLocalEditProduct(updated);
                                                            }
                                                            await setStockLevel(editingProduct.id, val, locationId);
                                                            router.refresh();
                                                        }}
                                                        className="w-16 h-9 bg-white border-2 border-slate-200 rounded-lg text-center font-black text-slate-900 font-mono text-[11px] focus:border-blue-600 outline-none"
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const res = await quickAddStock(editingProduct.id, -1, locationId);
                                                                if (res.success) router.refresh();
                                                            }}
                                                            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-slate-200 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const res = await quickAddStock(editingProduct.id, 1, locationId);
                                                                if (res.success) router.refresh();
                                                            }}
                                                            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-slate-200 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => { setEditingProduct(null); setLocalEditProduct(null); }}
                                className="px-8 py-3 rounded-2xl border-2 border-slate-100 text-[11px] font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 uppercase tracking-[0.15em] transition-all active:scale-95"
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-14 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 flex items-center gap-4 shadow-xl shadow-slate-900/10"
                            >
                                {loading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Committing…</>
                                ) : (
                                    <><Save size={18} /> Update Asset Record</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
                    <div className="p-10 text-center space-y-8">
                        <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                            <AlertCircle size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif text-slate-900 tracking-tight leading-none">
                                {productToDelete?.isBulk ? 'Authorize Bulk Deletion' : 'Authorize Asset Removal'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 px-4">
                                {productToDelete?.isBulk ? (
                                    <>Action will permanently remove <span className="text-slate-900 font-extrabold">{productToDelete.count} assets</span> from the central registry.</>
                                ) : (
                                    <>Action will permanently remove <span className="text-slate-900 font-extrabold">{productToDelete?.name}</span> and all associated historical data.</>
                                )}
                            </DialogDescription>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={productToDelete?.isBulk ? handleBulkDelete : handleDelete}
                                disabled={loading}
                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-xl shadow-slate-900/10 disabled:opacity-40 flex items-center justify-center gap-3"
                            >
                                {loading && <Loader2 className="animate-spin" size={14} />}
                                Confirm Removal
                            </button>
                            <button onClick={() => setIsDeleteDialogOpen(false)} className="w-full h-14 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border border-transparent">
                                Discard Action
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Barcode Print Dialog */}
            <BarcodePrintDialog
                product={printProduct}
                isOpen={!!printProduct}
                onClose={() => setPrintProduct(null)}
                currencySymbol={symbol}
            />

            <ProductHistoryDialog
                product={historyProduct}
                isOpen={!!historyProduct}
                onClose={() => setHistoryProduct(null)}
            />

            {
                showScanner && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                            <div className="p-8 bg-white text-slate-900 flex justify-between items-center border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
                                        <Camera size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="font-serif text-xl tracking-tight leading-none text-slate-900">Asset Recognition</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Optical Identifier Capture</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowScanner(false)} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-10">
                                <BarcodeScanner
                                    onScan={(code) => {
                                        setSearch(code);
                                        setShowScanner(false);
                                        toast.success(`Asset Identifier Captured: ${code}`);
                                    }}
                                    onClose={() => setShowScanner(false)}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
