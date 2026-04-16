'use client';

import { useState, useMemo } from 'react';
import { 
    Search, ShoppingCart, Package, ArrowRight, X,
    Warehouse as WarehouseIcon, CheckCircle2, 
    ChevronDown, ClipboardList, TrendingUp, Clock,
    Minus, Plus as PlusIcon, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { processSalesManagerSale } from '@/app/actions/salesManager';
import QuickInvoiceDialog from './QuickInvoiceDialog';

interface CartItem {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    quantity: number;
    maxStock: number;
}

export default function SalesManagerClient({ 
    products, warehouses, suppliers, shops, categories, units,
    todaySales = [],
    businessId, businessName, currencySymbol = '$'
}: { 
    products: any[];
    warehouses: any[];
    suppliers: any[];
    shops: any[];
    categories: any[];
    units: any[];
    todaySales?: any[];
    businessId: string | null;
    businessName?: string;
    currencySymbol?: string;
}) {
    const [activeTab, setActiveTab] = useState<'products' | 'today'>('products');
    const [search, setSearch] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [expandedSale, setExpandedSale] = useState<string | null>(null);

    const filteredProducts = useMemo(() => products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    ), [products, search]);

    const addToCart = (product: any) => {
        const inv = product.inventory?.find((i: any) => i.warehouseId === selectedWarehouseId);
        const availableStock = inv ? inv.quantity : 0;
        if (availableStock <= 0) { toast.error('No stock in selected warehouse'); return; }

        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity + 1 > availableStock) { toast.error('Stock limit reached'); return; }
            setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, {
                id: product.id, name: product.name, sku: product.sku,
                price: Number(product.price) || 0, quantity: 1, maxStock: availableStock
            }]);
        }
        toast.success(`${product.name} added`, { duration: 1000 });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id !== id) return item;
            const newQty = Math.max(1, Math.min(item.maxStock, item.quantity + delta));
            return { ...item, quantity: newQty };
        }));
    };

    const removeFromCart = (id: string) => setCart(cart.filter(i => i.id !== id));
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const todayTotal = todaySales.reduce((s: number, sale: any) => s + Number(sale.total || 0), 0);

    const handleCheckout = async () => {
        if (!selectedWarehouseId) { toast.error('Select a warehouse'); return; }
        if (!cart.length) return;
        setIsProcessing(true);
        const res = await processSalesManagerSale({
            businessId, warehouseId: selectedWarehouseId,
            items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price }))
        });
        if (res.success) {
            toast.success('Sale committed!');
            setCart([]);
            setCartOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || 'Failed');
        }
        setIsProcessing(false);
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    return (
        <div className="flex flex-col h-full">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b border-slate-100 px-4 pt-4 pb-0 sticky top-0 z-30">
                {/* Title + warehouse row */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                            Sales <span className="text-blue-600">Terminal</span>
                        </h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[200px]">
                            {businessName || 'INVENTORY_MANAGEMENT'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Missing items dialog */}
                        <QuickInvoiceDialog 
                            products={products} suppliers={suppliers} warehouses={warehouses}
                            shops={shops} categories={categories} units={units}
                            currencySymbol={currencySymbol} businessId={businessId}
                        />
                        {/* Cart button */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                        >
                            <ShoppingCart size={15} />
                            <span>Cart</span>
                            {cart.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full text-[9px] font-black flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Warehouse picker */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-3">
                    <WarehouseIcon size={13} className="text-blue-600 shrink-0" />
                    <select
                        value={selectedWarehouseId}
                        onChange={e => { setSelectedWarehouseId(e.target.value); setCart([]); }}
                        className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-wider outline-none border-none appearance-none cursor-pointer text-slate-700"
                    >
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 shrink-0" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1">
                    {[
                        { key: 'products', label: 'Products', icon: Package },
                        { key: 'today', label: `Today (${todaySales.length})`, icon: ClipboardList },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                                activeTab === tab.key
                                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                                    : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Products Tab ── */}
            {activeTab === 'products' && (
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 pb-32">
                    {/* Search */}
                    <div className="px-4 pt-4 pb-3">
                        <div className="relative">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-400 transition-colors shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Today's summary bar */}
                    {todaySales.length > 0 && (
                        <div className="mx-4 mb-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Today's Revenue</span>
                            </div>
                            <span className="text-sm font-black text-emerald-700 font-mono">{currencySymbol}{todayTotal.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto px-4 space-y-2">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                                    <Package size={28} className="text-slate-300" />
                                </div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Articles Found</p>
                                <p className="text-[9px] text-slate-300 mt-1">Try a different search term</p>
                            </div>
                        ) : filteredProducts.map(p => {
                            const inv = p.inventory?.find((i: any) => i.warehouseId === selectedWarehouseId);
                            const stock = inv ? inv.quantity : 0;
                            const cartItem = cart.find(i => i.id === p.id);
                            const inCart = !!cartItem;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => stock > 0 && addToCart(p)}
                                    className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer ${
                                        stock <= 0
                                            ? 'bg-slate-100 border-slate-100 opacity-50'
                                            : inCart
                                                ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
                                                : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                                        stock <= 0 ? 'bg-slate-200 text-slate-400'
                                        : inCart ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-slate-900 text-white'
                                    }`}>
                                        <Package size={20} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{p.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.sku || 'SKU N/A'}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-sm font-black text-blue-600">{currencySymbol}{Number(p.price || 0).toFixed(2)}</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                                stock <= 0 ? 'bg-rose-100 text-rose-600'
                                                : stock < 5 ? 'bg-amber-100 text-amber-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {stock <= 0 ? 'Out' : `${stock} left`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cart qty or add indicator */}
                                    {inCart && (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-md shadow-blue-500/20">
                                                {cartItem!.quantity}
                                            </div>
                                            <span className="text-[7px] text-blue-500 font-black uppercase">in cart</span>
                                        </div>
                                    )}
                                    {inCart && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Today's Sales Tab ── */}
            {activeTab === 'today' && (
                <div className="flex-1 overflow-y-auto bg-slate-50 pb-32">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">{todaySales.length}</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                            <p className="text-lg font-black text-emerald-600 font-mono">{currencySymbol}{todayTotal.toFixed(2)}</p>
                        </div>
                    </div>

                    {todaySales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                                <Receipt size={28} className="text-slate-300" />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Sales Today</p>
                            <p className="text-[9px] text-slate-300 mt-1">Completed sales will appear here throughout the day.</p>
                        </div>
                    ) : (
                        <div className="px-4 space-y-3">
                            {todaySales.map((sale: any) => (
                                <div key={sale.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                    <button
                                        className="w-full flex items-center gap-3 p-4 text-left"
                                        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                                    >
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                                            <Receipt size={16} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">#{sale.number}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock size={10} className="text-slate-400" />
                                                <span className="text-[9px] text-slate-400 font-medium">{formatTime(sale.createdAt)}</span>
                                                <span className="text-[9px] text-slate-300">·</span>
                                                <span className="text-[9px] text-slate-400">{sale.items?.length || 0} items</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-600 font-mono">{currencySymbol}{Number(sale.total || 0).toFixed(2)}</p>
                                            <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">
                                                {sale.user?.name?.split(' ')[0] || 'Manager'}
                                            </p>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-400 ml-1 transition-transform ${expandedSale === sale.id ? 'rotate-180' : ''}`} />
                                    </button>

                                    {expandedSale === sale.id && (
                                        <div className="border-t border-slate-50 bg-slate-50/50 p-4 space-y-2">
                                            {sale.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-700 uppercase">{item.product?.name || 'Item'}</p>
                                                        <p className="text-[9px] text-slate-400">×{item.quantity} @ {currencySymbol}{Number(item.price || 0).toFixed(2)}</p>
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-900 font-mono">
                                                        {currencySymbol}{(Number(item.price || 0) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Cart Sheet (slides from bottom) ── */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* Sheet */}
                    <div className="relative bg-slate-900 rounded-t-[2.5rem] flex flex-col max-h-[92vh] shadow-2xl">
                        {/* Handle */}
                        <div className="flex justify-center pt-4 pb-2">
                            <div className="w-10 h-1 bg-slate-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <ShoppingCart size={17} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-white leading-none">Dispatch Ledger</h2>
                                    <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">{cart.length} line{cart.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => setCartOpen(false)} className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 active:scale-95">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                    <ShoppingCart size={32} className="text-slate-600 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No items selected</p>
                                </div>
                            ) : cart.map(item => (
                                <div key={item.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/30 rounded-2xl p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate">{item.sku || 'ITEM'}</p>
                                        <p className="text-xs font-black text-white uppercase italic tracking-tight truncate">{item.name}</p>
                                        <p className="text-[11px] font-black text-emerald-400 font-mono mt-0.5">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>

                                    {/* Qty stepper */}
                                    <div className="flex items-center gap-1 bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white active:scale-95">
                                            <Minus size={13} />
                                        </button>
                                        <span className="w-7 text-center text-xs font-black text-white font-mono">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.id, +1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white active:scale-95">
                                            <PlusIcon size={13} />
                                        </button>
                                    </div>

                                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-500 active:scale-95">
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Checkout footer */}
                        <div className="px-5 pt-4 pb-10 border-t border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-black font-mono text-emerald-400 tracking-tighter">{currencySymbol}{total.toFixed(2)}</span>
                            </div>
                            <button
                                disabled={cart.length === 0 || isProcessing}
                                onClick={handleCheckout}
                                className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-[11px] font-black active:scale-[0.98] shadow-2xl ${
                                    cart.length === 0 || isProcessing
                                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                        : 'bg-blue-600 text-white shadow-blue-500/20'
                                }`}
                            >
                                {isProcessing ? (
                                    <span className="animate-pulse">Committing...</span>
                                ) : (
                                    <>Commit Dispatch <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
