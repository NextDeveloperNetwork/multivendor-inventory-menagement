'use client';

import { useState, useMemo } from 'react';
import {
    Search, ShoppingCart, Package, ArrowRight, X,
    Warehouse as WarehouseIcon, CheckCircle2,
    ChevronDown, ClipboardList, TrendingUp, Clock,
    Minus, Plus as PlusIcon, Receipt, Zap, BarChart3, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { processSalesManagerSale } from '@/app/actions/salesManager';
import { cn } from '@/lib/utils';
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
        toast.success(`${product.name} added`, { duration: 900 });
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
        try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
        catch { return ''; }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950">

            {/* ── DARK HERO HEADER ── */}
            <div className="relative overflow-hidden bg-slate-950 px-5 pt-6 pb-5">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/8 rounded-full blur-3xl -ml-24 pointer-events-none" />

                <div className="relative z-10">
                    {/* Title row */}
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-[0.3em] mb-1">
                                {businessName || 'INVENTORY MANAGEMENT'}
                            </p>
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Sales <span className="text-blue-400">Terminal</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <QuickInvoiceDialog
                                products={products} suppliers={suppliers} warehouses={warehouses}
                                shops={shops} categories={categories} units={units}
                                currencySymbol={currencySymbol} businessId={businessId}
                            />
                            {/* Cart FAB */}
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/40 active:scale-95 transition-all"
                            >
                                <ShoppingCart size={15} />
                                Cart
                                {cart.length > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 text-slate-900 rounded-full text-[9px] font-black flex items-center justify-center shadow-lg">
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Today's stats strip */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                            { label: 'Products', value: products.length, color: 'text-blue-400', icon: Package },
                            { label: 'Tx Today', value: todaySales.length, color: 'text-amber-400', icon: BarChart3 },
                            { label: 'In Cart', value: cart.length, color: 'text-emerald-400', icon: ShoppingCart },
                        ].map(s => (
                            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                <s.icon size={13} className={cn("mb-1.5", s.color)} />
                                <p className={cn("text-xl font-black tabular-nums text-white leading-none")}>{s.value}</p>
                                <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5", s.color)}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Revenue strip */}
                    {todaySales.length > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Today's Revenue</span>
                            </div>
                            <span className="text-base font-black text-emerald-400 tabular-nums">{currencySymbol}{todayTotal.toLocaleString()}</span>
                        </div>
                    )}

                    {/* Warehouse picker */}
                    <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-4">
                        <WarehouseIcon size={14} className="text-blue-400 shrink-0" />
                        <select
                            value={selectedWarehouseId}
                            onChange={e => { setSelectedWarehouseId(e.target.value); setCart([]); }}
                            className="flex-1 bg-transparent text-[11px] font-black uppercase tracking-wider outline-none border-none appearance-none cursor-pointer text-white"
                        >
                            {warehouses.map(w => <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>)}
                        </select>
                        <ChevronDown size={12} className="text-white/30 shrink-0" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {[
                            { key: 'products', label: 'Products', icon: Package },
                            { key: 'today', label: `Today (${todaySales.length})`, icon: ClipboardList },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                                    activeTab === tab.key
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                        : "bg-white/5 text-white/40 border border-white/10"
                                )}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 'products' && (
                <div className="flex-1 bg-slate-100 rounded-t-[2rem] flex flex-col overflow-hidden">
                    {/* Search */}
                    <div className="px-4 pt-4 pb-3 bg-slate-100 shrink-0">
                        <div className="relative">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-400 transition-colors shadow-sm"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Product list */}
                    <div className="flex-1 overflow-y-auto px-4 pb-36 space-y-2.5">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                                    <Package size={28} className="text-slate-200" />
                                </div>
                                <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">No Articles Found</h3>
                                <p className="text-[11px] text-slate-400 font-medium mt-1.5">Try a different search term</p>
                            </div>
                        ) : filteredProducts.map(p => {
                            const inv = p.inventory?.find((i: any) => i.warehouseId === selectedWarehouseId);
                            const stock = inv ? inv.quantity : 0;
                            const cartItem = cart.find(i => i.id === p.id);
                            const inCart = !!cartItem;
                            const outOfStock = stock <= 0;
                            const lowStock = stock > 0 && stock < 5;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !outOfStock && addToCart(p)}
                                    className={cn(
                                        "relative flex items-center gap-3.5 p-4 rounded-[1.5rem] border transition-all active:scale-[0.98]",
                                        outOfStock ? "bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed"
                                            : inCart ? "bg-blue-50 border-blue-200 shadow-md shadow-blue-100 cursor-pointer"
                                                : "bg-white border-slate-100 shadow-sm hover:border-blue-200 cursor-pointer"
                                    )}
                                >
                                    {/* Gradient accent */}
                                    {!outOfStock && (
                                        <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-full",
                                            inCart ? "bg-blue-500" : lowStock ? "bg-amber-400" : "bg-slate-200"
                                        )} />
                                    )}

                                    {/* Icon */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                        outOfStock ? "bg-slate-200 text-slate-400"
                                            : inCart ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                                : "bg-slate-900 text-white"
                                    )}>
                                        <Package size={20} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{p.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.sku || 'SKU N/A'}</p>
                                        <div className="flex items-center gap-2.5 mt-1.5">
                                            <span className="text-sm font-black text-blue-600">{currencySymbol}{Number(p.price || 0).toFixed(2)}</span>
                                            <span className={cn(
                                                "text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider",
                                                outOfStock ? "bg-rose-100 text-rose-600"
                                                    : lowStock ? "bg-amber-100 text-amber-700"
                                                        : "bg-slate-100 text-slate-500"
                                            )}>
                                                {outOfStock ? "Out" : `${stock} left`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cart qty badge */}
                                    {inCart && (
                                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                                            <div className="w-9 h-9 bg-blue-500 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-md shadow-blue-500/20">
                                                {cartItem!.quantity}
                                            </div>
                                            <span className="text-[7px] text-blue-500 font-black uppercase">in cart</span>
                                        </div>
                                    )}
                                    {inCart && (
                                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── TODAY'S SALES TAB ── */}
            {activeTab === 'today' && (
                <div className="flex-1 bg-slate-100 rounded-t-[2rem] overflow-y-auto pb-36">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><BarChart3 size={10} /> Transactions</p>
                            <p className="text-2xl font-black text-slate-900 tabular-nums">{todaySales.length}</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp size={10} className="text-emerald-500" /> Revenue</p>
                            <p className="text-xl font-black text-emerald-600 tabular-nums">{currencySymbol}{todayTotal.toLocaleString()}</p>
                        </div>
                    </div>

                    {todaySales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                                <Receipt size={28} className="text-slate-200" />
                            </div>
                            <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">No Sales Yet</h3>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5 max-w-[200px] leading-relaxed">
                                Completed transactions will appear here throughout the day.
                            </p>
                        </div>
                    ) : (
                        <div className="px-4 space-y-3">
                            {todaySales.map((sale: any) => (
                                <div key={sale.id} className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                                    <button
                                        className="w-full flex items-center gap-3 p-4 text-left"
                                        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                                    >
                                        <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
                                            <Receipt size={17} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">#{sale.number}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={9} className="text-slate-300" />
                                                    <span className="text-[9px] text-slate-400 font-medium" suppressHydrationWarning>{formatTime(sale.createdAt)}</span>
                                                </div>
                                                <span className="text-[9px] text-slate-300">·</span>
                                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{sale.items?.length || 0} items</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-emerald-600 tabular-nums">{currencySymbol}{Number(sale.total || 0).toFixed(2)}</p>
                                            <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">
                                                {sale.user?.name?.split(' ')[0] || 'Manager'}
                                            </p>
                                        </div>
                                        <ChevronDown size={14} className={cn("text-slate-300 ml-1 transition-transform", expandedSale === sale.id && "rotate-180")} />
                                    </button>

                                    {expandedSale === sale.id && (
                                        <div className="border-t border-slate-50 bg-slate-50/60 px-4 py-3 space-y-2">
                                            {sale.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{item.product?.name || 'Item'}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold">×{item.quantity} @ {currencySymbol}{Number(item.price || 0).toFixed(2)}</p>
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-900 tabular-nums">
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

            {/* ── CART BOTTOM SHEET ── */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

                    <div className="relative bg-slate-900 rounded-t-[2.5rem] flex flex-col max-h-[92dvh] shadow-[0_-20px_60px_rgba(0,0,0,0.4)]">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <ShoppingCart size={17} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase italic tracking-tight text-white leading-none">Dispatch Ledger</h2>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{cart.length} line{cart.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => setCartOpen(false)} className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 active:scale-95">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                                    <ShoppingCart size={36} className="text-slate-600 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No items selected</p>
                                </div>
                            ) : cart.map(item => (
                                <div key={item.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-3.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{item.sku || 'ITEM'}</p>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight truncate">{item.name}</p>
                                        <p className="text-[11px] font-black text-emerald-400 tabular-nums mt-0.5">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>

                                    {/* Qty stepper */}
                                    <div className="flex items-center gap-0.5 bg-slate-950 rounded-xl border border-slate-800 p-1 shrink-0">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white active:scale-90">
                                            <Minus size={13} />
                                        </button>
                                        <span className="w-7 text-center text-sm font-black text-white tabular-nums">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.id, +1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white active:scale-90">
                                            <PlusIcon size={13} />
                                        </button>
                                    </div>

                                    <button onClick={() => removeFromCart(item.id)} className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-500 active:scale-90 shrink-0">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Checkout footer */}
                        <div className="px-5 pt-4 pb-9 border-t border-slate-800 space-y-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">{currencySymbol}{total.toLocaleString()}</span>
                            </div>
                            <button
                                disabled={cart.length === 0 || isProcessing}
                                onClick={handleCheckout}
                                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-[11px] font-black active:scale-[0.98] shadow-2xl bg-blue-500 text-white shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isProcessing
                                    ? <Loader2 size={20} className="animate-spin" />
                                    : <><Zap size={16} /> Commit Dispatch</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
