'use client';

import { useState } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Zap,
    Activity,
    X,
    Scan,
    ArrowRight,
    Activity as ActivityIcon,
    Box,
    CreditCard,
    QrCode,
    Sparkles,
    Users,
    Key,
    Lock,
    Unlock,
    Receipt,
    Share2,
    MessageCircle,
    DollarSign,
    Heart,
    UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { processSale } from '@/app/actions/sales';
import { openShift, closeShift } from '@/app/actions/shifts';
import { createCustomer } from '@/app/actions/intelligence';
import { useRouter } from 'next/navigation';
import BarcodeScanner from './BarcodeScanner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';

interface Inventory {
    id: string;
    quantity: number;
    shopId: string;
}

interface ProductWithInventory {
    id: string;
    name: string;
    price: number;
    discountPrice: number | null;
    sku: string;
    barcode: string | null;
    inventory: Inventory[];
}

interface SaleInterfaceProps {
    products: ProductWithInventory[];
    shopId: string;
    userId: string;
    currency: {
        symbol: string;
        rate: string;
    } | null;
    initialShift: any | null;
    customers: any[];
}

interface CartItem {
    product: ProductWithInventory;
    quantity: number;
    price: number;
}

export default function POSInterface({
    products,
    shopId,
    userId,
    currency,
    initialShift,
    customers
}: SaleInterfaceProps) {
    const rate = currency?.rate ? Number(currency.rate) : 1;
    const symbol = currency?.symbol || '$';

    const getPrice = (product: ProductWithInventory) => {
        let basePrice = Number(product.price);
        if (product.discountPrice && Number(product.discountPrice) < basePrice) {
            basePrice = Number(product.discountPrice);
        }
        return basePrice * rate;
    };

    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

    // PREMIUM FEATURES STATE
    const [shift, setShift] = useState(initialShift);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(!initialShift);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    const router = useRouter();

    const filteredProducts = products.filter(p => {
        const stock = p.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
        const matchesSearch =
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.includes(query) ||
            (p.barcode && p.barcode.includes(query));
        return matchesSearch && stock > 0;
    });

    const addToCart = (product: ProductWithInventory) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                const stock = product.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                if (existing.quantity >= stock) {
                    toast.error("Stock limit reached", {
                        style: { background: '#fee2e2', color: '#991b1b', border: '2px solid #fca5a5' }
                    });
                    return prev;
                }

                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1, price: getPrice(product) }];
        });
        toast.success(`Added: ${product.name}`, {
            style: { background: '#dbeafe', color: '#1e40af', border: '2px solid #93c5fd' }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;

                const product = products.find(p => p.id === productId);
                const stock = product?.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                if (newQty > stock) {
                    toast.error("Stock limit reached");
                    return item;
                }

                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);

    const handleOpenShift = async () => {
        if (!openingCash) return;
        setLoading(true);
        const res = await openShift(shopId, Number(openingCash), userId);
        if (res.success) {
            setShift(res.shift);
            setIsShiftModalOpen(false);
            toast.success('Shift started successfully');
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleCloseShift = async () => {
        if (!closingCash) return;
        setLoading(true);
        const res = await closeShift(shift.id, Number(closingCash));
        if (res.success) {
            setShift(null);
            setClosingCash('');
            setOpeningCash('');
            setIsShiftModalOpen(true);
            toast.success('Shift closed & reconciled');
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleAddCustomer = async (formData: FormData) => {
        const res = await createCustomer(formData);
        if (res.success) {
            toast.success("Customer added successfully!");
            setIsAddCustomerModalOpen(false);
            setSelectedCustomer(res.customer);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to add customer");
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!shift) {
            setIsShiftModalOpen(true);
            toast.error("Please open a shift first");
            return;
        }
        setLoading(true);

        const saleItems = cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price
        }));

        try {
            const res = await processSale(saleItems, shopId, selectedCustomer?.id);
            if (res.error) {
                toast.error(res.error);
                setLoading(false);
            } else {
                toast.success('Sale completed successfully!', {
                    style: { background: '#d1fae5', color: '#065f46', border: '2px solid #6ee7b7' }
                });
                setCart([]);
                setSelectedCustomer(null);
                router.refresh();
                setLoading(false);
                setActiveTab('products');
            }
        } catch (e) {
            toast.error("Transaction failed");
            setLoading(false);
        }
    };

    const onScan = (code: string) => {
        const product = products.find(p => p.barcode === code || p.sku === code);
        if (product) {
            addToCart(product);
            setShowScanner(false);
        } else {
            toast.error("Product not found");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden animate-in fade-in duration-500">

            {/* Mobile Navigation */}
            <div className="flex md:hidden bg-white border-b-2 border-blue-100 p-2 shrink-0 shadow-sm">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all ${activeTab === 'products' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600'}`}
                >
                    <Box size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Products</span>
                </button>
                <button
                    onClick={() => setActiveTab('cart')}
                    className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all relative ${activeTab === 'cart' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600'}`}
                >
                    <div className="relative">
                        <ShoppingCart size={20} />
                        {cart.length > 0 && (
                            <span className="absolute -top-3 -right-3 bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black border-2 border-white">
                                {cart.length}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Cart</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 p-6 overflow-hidden">

                {/* Main Product Interface */}
                <div className={`flex-1 flex flex-col gap-8 h-full transition-all duration-300 ${activeTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>

                    {/* Search Bar */}
                    <div className="flex gap-3 sm:gap-4 shrink-0 px-2 sm:px-0">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl sm:rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-50 transition-opacity"></div>
                            <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5 sm:w-6 sm:h-6" />
                            <input
                                className="relative w-full pl-12 sm:pl-16 pr-5 sm:pr-6 h-14 sm:h-20 bg-white border-2 border-blue-100 rounded-2xl sm:rounded-[2rem] font-bold text-base sm:text-lg placeholder:text-slate-300 focus:border-blue-600 outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-blue-500/10"
                                placeholder="Search products..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-2xl sm:rounded-[2rem] flex items-center justify-center transition-all active:scale-95 shadow-xl shadow-purple-500/30 group shrink-0"
                        >
                            <Scan className="group-hover:scale-110 transition-transform w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto px-2 sm:pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProducts.map(product => {
                                const stock = product.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                                const originalPrice = Number(product.price);
                                const currentPrice = getPrice(product);
                                const hasDiscount = currentPrice < originalPrice;

                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="group bg-white border-2 border-blue-100 p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] flex flex-col items-start hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left relative active:scale-[0.98] overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                                <Plus size={20} strokeWidth={3} />
                                            </div>
                                        </div>

                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${stock < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                            {product.sku}
                                        </div>

                                        <div className="font-black text-slate-900 mb-4 sm:mb-6 line-clamp-2 text-base sm:text-lg leading-tight uppercase tracking-tight flex-1">
                                            {product.name}
                                        </div>

                                        <div className="w-full pt-4 sm:pt-5 border-t-2 border-blue-50 flex justify-between items-end">
                                            <div className="flex flex-col">
                                                {hasDiscount && (
                                                    <span className="text-[10px] line-through text-slate-300 font-black mb-1">
                                                        {symbol}{(originalPrice * rate).toFixed(2)}
                                                    </span>
                                                )}
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xs sm:text-sm font-black text-blue-600">{symbol}</span>
                                                    <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tighter ${hasDiscount ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {currentPrice.toFixed(0)}<span className="text-xs sm:text-sm opacity-40">.{currentPrice.toFixed(2).split('.')[1]}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-blue-100 flex flex-col items-center">
                                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5 sm:mb-1">Stock</span>
                                                <span className={`text-xs sm:text-sm font-black ${stock < 10 ? 'text-amber-600' : 'text-slate-900'}`}>{stock}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-dashed border-blue-200">
                                    <ActivityIcon size={40} className="text-blue-400" />
                                </div>
                                <p className="text-lg font-black text-slate-400 uppercase tracking-widest">No Products Found<br /><span className="text-xs tracking-widest font-bold">Try a different search</span></p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Sidebar */}
                <div className={`flex flex-col md:w-[480px] bg-white rounded-[3.5rem] shadow-2xl shadow-blue-500/10 overflow-hidden shrink-0 relative transition-all duration-500 border-2 border-blue-100 ${activeTab === 'cart' ? 'flex flex-1 h-full' : 'hidden md:flex'}`}>

                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-48 -mt-48 blur-[100px] opacity-50"></div>

                    {/* Cart Header */}
                    <div className="relative px-10 pt-10 pb-8 flex justify-between items-center shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-100">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Sparkles size={18} className="text-blue-600 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Cart</span>
                            </div>
                            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent tracking-tighter uppercase leading-none">
                                Shopping Cart
                            </h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsShiftModalOpen(true)}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${shift ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-rose-50 text-rose-600 border-2 border-rose-100'}`}
                            >
                                {shift ? <Unlock size={20} /> : <Lock size={20} />}
                            </button>
                            <div className="bg-white border-2 border-blue-200 px-5 py-3 rounded-2xl flex flex-col items-center shadow-sm">
                                <span className="text-blue-400 text-[8px] font-black uppercase tracking-widest mb-1">Items</span>
                                <span className="text-2xl font-black text-slate-900 tabular-nums">{cart.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div className="px-6 py-4 bg-white border-b-2 border-blue-50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                {selectedCustomer ? (
                                    <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">
                                                {selectedCustomer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Customer Profile</div>
                                                <div className="text-sm font-black text-slate-900">{selectedCustomer.name}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-rose-500">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedCustomer?.id || ''}
                                            onChange={(e) => {
                                                const c = customers.find(cust => cust.id === e.target.value);
                                                setSelectedCustomer(c || null);
                                            }}
                                            className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-black font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                                        >
                                            <option value="">Walk-in Customer</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsAddCustomerModalOpen(true)}
                                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                            title="Quick Register New Customer"
                                        >
                                            <UserPlus size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-all">
                                <Users size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                                    <ShoppingCart size={32} className="text-blue-400" />
                                </div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Cart is Empty<br /><span className="text-xs">Add products to get started</span></p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product.id} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-[2rem] border-2 border-blue-100 group hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 pr-4">
                                            <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">{item.product.sku}</div>
                                            <div className="font-black text-slate-900 text-base leading-tight uppercase">{item.product.name}</div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="w-8 h-8 bg-rose-100 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t-2 border-blue-100">
                                        <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-blue-200 p-1">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="w-8 h-8 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
                                            >
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="w-12 text-center font-black text-slate-900 tabular-nums">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="w-8 h-8 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Subtotal</div>
                                            <div className="text-xl font-black text-slate-900 tabular-nums">{symbol}{(item.price * item.quantity).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Footer */}
                    <div className="relative p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-blue-100 shrink-0 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Total Amount</span>
                            <div className="text-right">
                                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tabular-nums tracking-tighter">{symbol}{total.toFixed(2)}</div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || loading}
                            className="w-full h-20 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
                        >
                            {loading ? (
                                <>
                                    <Activity className="animate-spin" size={24} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={24} className="group-hover:scale-110 transition-transform" />
                                    Complete Sale
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <BarcodeScanner onScan={onScan} onClose={() => setShowScanner(false)} />
            )}

            {/* Shift Management Portal */}
            <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-slate-900 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter relative z-10 flex items-center gap-4">
                            {shift ? <Unlock className="text-emerald-500" /> : <Lock className="text-rose-500" />}
                            Shift <span className="text-blue-500">Portal</span>
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 relative z-10">
                            Authorized Secure Access Entry
                        </DialogDescription>
                    </DialogHeader>

                    {!shift ? (
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Starting Cash (Float)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="number"
                                        value={openingCash}
                                        onChange={(e) => setOpeningCash(e.target.value)}
                                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl focus:border-blue-400 focus:bg-white outline-none transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleOpenShift}
                                disabled={loading || !openingCash}
                                className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-4"
                            >
                                {loading ? <Activity className="animate-spin" /> : <Key />}
                                Activate Shift
                            </button>
                        </div>
                    ) : (
                        <div className="p-10 space-y-8">
                            <div className="space-y-1 border-b-2 border-slate-50 pb-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active session since</div>
                                <div className="text-lg font-black text-slate-900">{new Date(shift.openedAt).toLocaleString()}</div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Counted Cash @ Close</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="number"
                                        value={closingCash}
                                        onChange={(e) => setClosingCash(e.target.value)}
                                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl focus:border-blue-400 focus:bg-white outline-none transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold text-center italic">Digital totals will be reconciled upon termination</p>
                            </div>
                            <button
                                onClick={handleCloseShift}
                                disabled={loading || !closingCash}
                                className="w-full h-20 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-500/20 transition-all flex items-center justify-center gap-4"
                            >
                                {loading ? <Activity className="animate-spin" /> : <Lock />}
                                Terminate Shift
                            </button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* REGISTRATION MODAL */}
            <Dialog open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <UserPlus size={120} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">New Profile</DialogTitle>
                            <DialogDescription className="text-rose-100 font-bold uppercase text-[10px] tracking-widest mt-2">
                                Acquisition Mode Active
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form action={handleAddCustomer} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Full Name</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-rose-500 focus:bg-white transition-all outline-none"
                                    placeholder="e.g. JEFF DEAN"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Mobile Core</label>
                                <input
                                    name="phone"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-rose-500 focus:bg-white transition-all outline-none"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Email Node</label>
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-rose-500 focus:bg-white transition-all outline-none"
                                    placeholder="client@network.com"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-rose-200 uppercase tracking-widest text-xs italic"
                            >
                                Provision Profile
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

    );
}
