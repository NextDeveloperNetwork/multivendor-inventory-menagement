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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    imageUrl: string | null;
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
    const [activeTab, setActiveTab] = useState<'products' | 'cart' | 'checkout'>('products');

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
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white overflow-hidden animate-in fade-in duration-500">

            {/* Mobile Navigation */}
            <div className="md:hidden shrink-0 border-b border-slate-100 bg-white p-2 shadow-sm">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-slate-50 rounded-2xl h-auto p-1 border-none">
                        <TabsTrigger
                            value="products"
                            className="flex flex-col gap-1.5 py-3 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg"
                        >
                            <Box size={18} />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Catalog</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="cart"
                            className="flex flex-col gap-1.5 py-3 rounded-xl relative data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg"
                        >
                            <div className="relative">
                                <ShoppingCart size={18} />
                                {cart.length > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-primary text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-black border border-white">
                                        {cart.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Cart</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="checkout"
                            className="flex flex-col gap-1.5 py-3 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg"
                        >
                            <CreditCard size={18} />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Pay</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 p-6 overflow-hidden">

                {/* Main Product Interface */}
                <div className={`flex-1 flex flex-col gap-8 h-full transition-all duration-300 ${activeTab !== 'products' ? 'hidden md:flex' : 'flex'}`}>

                    {/* Search Bar */}
                    <div className="flex gap-4 shrink-0 mt-2 px-2 sm:px-0">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-5 h-5 z-10" />
                            <Input
                                className="w-full pl-14 h-16 sm:h-20 bg-white border-slate-200 rounded-[1.5rem] sm:rounded-[2.5rem] text-sm sm:text-lg font-bold placeholder:text-slate-300 focus-visible:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                placeholder="Scan or search products..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => setShowScanner(true)}
                            className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 hover:bg-primary text-white rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center transition-all shadow-xl"
                        >
                            <Scan size={32} />
                        </Button>
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
                                    <Card
                                        key={product.id}
                                        className="group bg-white border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer active:scale-[0.98] flex flex-row sm:flex-col items-center sm:items-stretch h-32 sm:h-auto"
                                        onClick={() => addToCart(product)}
                                    >
                                        <div className="relative overflow-hidden bg-slate-50 w-32 sm:w-full aspect-square shrink-0 order-2 sm:order-1">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-10">
                                                    <Box size={48} className="text-slate-400" />
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                                                    <Plus size={16} strokeWidth={3} />
                                                </div>
                                            </div>

                                            {hasDiscount && (
                                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-rose-500 text-white text-[8px] sm:text-[10px] font-black uppercase px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg shadow-lg italic">
                                                    Flash
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between order-1 sm:order-2 min-w-0 h-full">
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 italic truncate">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${stock < 10 ? 'bg-amber-500' : 'bg-primary'}`}></div>
                                                    {product.sku}
                                                </div>
                                                <h3 className="font-black text-slate-900 line-clamp-2 text-sm sm:text-base uppercase italic tracking-tight leading-tight">
                                                    {product.name}
                                                </h3>
                                            </div>

                                            <div className="flex justify-between items-end gap-2 mt-auto">
                                                <div className="flex flex-col">
                                                    {hasDiscount && (
                                                        <span className="text-[9px] sm:text-[11px] line-through text-slate-300 font-bold">
                                                            {symbol}{(originalPrice * rate).toFixed(2)}
                                                        </span>
                                                    )}
                                                    <div className="flex items-baseline">
                                                        <span className="text-[10px] sm:text-[12px] font-black text-primary/40 mr-1">{symbol}</span>
                                                        <span className={`text-lg sm:text-2xl font-black tabular-nums tracking-tighter italic ${hasDiscount ? 'text-primary' : 'text-slate-900'}`}>
                                                            {currentPrice.toFixed(0)}<span className="text-[11px] sm:text-[13px] opacity-20">.{currentPrice.toFixed(2).split('.')[1]}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border border-slate-100 flex items-baseline sm:flex-col sm:items-center gap-1.5 sm:gap-0 shadow-inner">
                                                    <span className="text-[7px] sm:text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Stock</span>
                                                    <span className={`text-[11px] sm:text-[14px] font-black font-mono ${stock < 10 ? 'text-amber-600' : 'text-slate-900'}`}>{stock}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                                <ActivityIcon size={80} className="mb-6 text-slate-200" />
                                <p className="text-xl font-black uppercase tracking-widest">No profiles detected in current sector</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Sidebar */}
                <div className={`flex flex-col md:w-[480px] bg-white rounded-[3.5rem] shadow-sm overflow-hidden shrink-0 relative transition-all duration-500 border border-slate-100 ${activeTab === 'products' ? 'hidden md:flex' : 'flex flex-1 h-full'}`}>

                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[100px]"></div>

                    {/* Cart Header */}
                    <div className="relative px-8 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8 flex justify-between items-center shrink-0 bg-slate-50 border-b border-slate-100">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Sparkles size={16} className="text-primary" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Terminal Active</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                {activeTab === 'checkout' ? 'Review & Pay' : 'Shopping Cart'}
                            </h2>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => setIsShiftModalOpen(true)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${shift ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
                            >
                                {shift ? <Unlock size={18} /> : <Lock size={18} />}
                            </button>
                            <div className="bg-white border border-slate-200 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex flex-col items-center shadow-sm">
                                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 italic">Nodes</span>
                                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{cart.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div className={`px-6 py-6 bg-white border-b border-slate-50 ${activeTab === 'products' ? 'hidden md:block' : activeTab === 'cart' ? 'hidden md:block' : 'block'}`}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 italic">Customer Assignment</div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                {selectedCustomer ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">
                                                {selectedCustomer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Active Profile</div>
                                                <div className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{selectedCustomer.name}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedCustomer(null)} className="text-slate-300 hover:text-rose-500 transition-colors">
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
                                            className="flex-1 h-14 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 font-bold focus:border-primary focus:bg-white transition-all appearance-none outline-none text-sm uppercase italic"
                                        >
                                            <option value="">[ Walk-in Customer ]</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsAddCustomerModalOpen(true)}
                                            className="w-14 h-14 bg-slate-900 text-white rounded-xl hover:bg-primary transition-all shadow-lg shadow-black/10 flex items-center justify-center"
                                            title="Quick Register New Customer"
                                        >
                                            <UserPlus size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className={`flex-1 overflow-hidden relative bg-white ${activeTab === 'checkout' ? 'md:block hidden' : ''}`}>
                        <ScrollArea className="h-full px-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                        <ShoppingCart size={32} className="text-slate-200" />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Empty Stack</p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Awaiting node selection</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex items-center gap-4 py-4 sm:py-6 group transition-all">
                                            <div className="flex-1 min-w-0 order-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-black text-slate-900 truncate uppercase text-sm tracking-tight italic">{item.product.name}</h4>
                                                    <span className="font-black text-slate-900 tabular-nums ml-4 text-sm font-mono">{symbol}{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center justify-between h-8">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md italic">SKU//{item.product.sku}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 italic">
                                                            @{symbol}{item.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                                                            >
                                                                <Minus size={12} strokeWidth={3} />
                                                            </button>
                                                            <span className="w-8 text-center text-xs font-black text-slate-900 tabular-nums font-mono">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                                                            >
                                                                <Plus size={12} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.product.id)}
                                                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:bg-primary/5 transition-colors order-2">
                                                {item.product.imageUrl ? (
                                                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Box size={24} className="text-slate-200" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {activeTab === 'cart' && cart.length > 0 && (
                            <div className="md:hidden mt-8 pb-10">
                                <button
                                    onClick={() => setActiveTab('checkout')}
                                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"
                                >
                                    Proceed to Checkout <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cart Footer / Checkout Controls */}
                    <div className={`relative p-8 sm:p-10 bg-slate-900 shrink-0 mt-auto ${activeTab === 'products' ? 'hidden md:block' : activeTab === 'cart' ? 'hidden md:block' : 'block'}`}>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic font-mono px-2 border-l-2 border-primary/40">Validated Total</span>
                            <div className="text-right">
                                <div className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tighter italic font-mono">
                                    <span className="text-primary text-xl sm:text-2xl mr-1 not-italic opacity-40">{symbol}</span>
                                    {total.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || loading}
                            className="w-full h-16 sm:h-20 bg-primary hover:bg-primary/90 disabled:bg-slate-800 text-white rounded-[1.5rem] font-black text-base sm:text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-4 group italic border-none"
                        >
                            {loading ? (
                                <>
                                    <Activity className="animate-spin" size={24} />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={24} className="group-hover:scale-110 transition-transform" />
                                    [ Finalize Transaction ]
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
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
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter relative z-10 flex items-center gap-4">
                            {shift ? <Unlock className="text-emerald-500" /> : <Lock className="text-primary" />}
                            Shift <span className="text-primary">Portal</span>
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 relative z-10 italic">
                            Authorized Secure Access Entry
                        </DialogDescription>
                    </DialogHeader>

                    {!shift ? (
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Starting Cash (Float)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type="number"
                                        value={openingCash}
                                        onChange={(e) => setOpeningCash(e.target.value)}
                                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl focus:border-primary focus:bg-white outline-none transition-all font-mono italic"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleOpenShift}
                                disabled={loading || !openingCash}
                                className="w-full h-20 bg-slate-900 hover:bg-primary disabled:bg-slate-800 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-4 italic"
                            >
                                {loading ? <Activity className="animate-spin" /> : <Key />}
                                [ Activate Shift ]
                            </button>
                        </div>
                    ) : (
                        <div className="p-10 space-y-8">
                            <div className="space-y-1 border-b border-slate-50 pb-6 font-mono">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Active session since</div>
                                <div className="text-lg font-black text-slate-900">{new Date(shift.openedAt).toLocaleString().toUpperCase()}</div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Counted Cash @ Close</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type="number"
                                        value={closingCash}
                                        onChange={(e) => setClosingCash(e.target.value)}
                                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl focus:border-primary focus:bg-white outline-none transition-all font-mono italic"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-300 font-bold text-center italic uppercase tracking-tighter">Digital totals will be reconciled upon termination</p>
                            </div>
                            <button
                                onClick={handleCloseShift}
                                disabled={loading || !closingCash}
                                className="w-full h-20 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-500/20 transition-all flex items-center justify-center gap-4 italic"
                            >
                                {loading ? <Activity className="animate-spin" /> : <Lock />}
                                [ Terminate Shift ]
                            </button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* REGISTRATION MODAL */}
            <Dialog open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">New Profile <span className="text-primary">Acquisition</span></DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3 relative z-10 px-1 border-l-4 border-primary/30 italic">
                                Establish a new customer entry in the global registry
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form action={handleAddCustomer} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1 italic">Full Name / Entity</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-primary focus:bg-white transition-all outline-none italic"
                                    placeholder="e.g. Johnathan Sentinel"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1 italic">Voice Identifier</label>
                                <input
                                    name="phone"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-primary focus:bg-white transition-all outline-none italic"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1 italic">Digital Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-primary focus:bg-white transition-all outline-none italic"
                                    placeholder="nexus@client.com"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-slate-900 hover:bg-primary text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-black/10 uppercase tracking-widest text-xs italic"
                            >
                                [ Provision Profile ]
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

    );
}
