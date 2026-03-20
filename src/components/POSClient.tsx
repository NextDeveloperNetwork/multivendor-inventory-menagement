'use client';

import { useState, useMemo } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    X,
    Scan,
    ArrowRight,
    Activity as ActivityIcon,
    Box,
    CreditCard,
    Sparkles,
    UserPlus,
    Lock,
    Unlock,
    DollarSign,
    MoreVertical,
    ChevronRight,
    Store,
    Clock,
    User
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// --- Types ---
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
    category: { id: string, name: string } | null;
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

// --- Main Component ---
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

    const router = useRouter();

    // --- State ---
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'pay'>('catalog');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    
    const [shift, setShift] = useState(initialShift);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(!initialShift);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    // --- Helpers ---
    const getPriceRaw = (product: ProductWithInventory) => {
        const base = Number(product.price) || 0;
        const discount = product.discountPrice ? Number(product.discountPrice) : 0;
        return (discount > 0 && discount < base) ? discount : base;
    };

    const getPrice = (product: ProductWithInventory) => getPriceRaw(product) * rate;

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const stock = p.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
            const matchesSearch =
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.sku.toLowerCase().includes(query.toLowerCase()) ||
                (p.barcode && p.barcode.includes(query));
            
            const matchesCategory = selectedCategory === 'ALL' || p.category?.id === selectedCategory;
            
            return matchesSearch && matchesCategory && stock > 0;
        });
    }, [products, query, selectedCategory, shopId]);

    const categories = useMemo(() => {
        const uniqueIds = Array.from(new Set(products.map(p => p.category?.id).filter((id): id is string => !!id)));
        return uniqueIds.map(id => {
            const prod = products.find(p => p.category?.id === id);
            return { id, name: prod?.category?.name || 'Unknown' };
        });
    }, [products]);

    // --- Actions ---
    const onScan = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product);
            setShowScanner(false);
            toast.success(`Optical Scan Successful: ${product.name}`);
        } else {
            toast.error(`Barcode not recognized: ${barcode}`);
        }
    };

    const addToCart = (product: ProductWithInventory) => {
        const stock = product.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
        
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= stock) {
                    toast.error("Stock limit reached", {
                        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
                    });
                    return prev;
                }
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1, price: getPrice(product) }];
        });

        toast.success(`Product added to cart`, {
            style: { background: '#f5f3ff', color: '#4338ca', border: '1px solid #ddd6fe' }
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;

                const product = products.find(p => p.id === productId);
                const stock = product?.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                
                if (newQty > stock) {
                    toast.error("Insufficient stock available");
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subtotal = total; // can add discount logic here later

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!shift) {
            setIsShiftModalOpen(true);
            toast.error("Operations restricted: Please activate shift session");
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
            } else {
                toast.success('Sale Processed Successfully', {
                    style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
                });
                setCart([]);
                setSelectedCustomer(null);
                router.refresh();
                setActiveTab('catalog');
            }
        } catch (e) {
            toast.error("System error: Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async () => {
        if (!openingCash) return;
        setLoading(true);
        const res = await openShift(shopId, Number(openingCash), userId);
        if (res.success) {
            setShift(res.shift);
            setIsShiftModalOpen(false);
            toast.success('Shift Activated');
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
            router.refresh();
            toast.success('Shift Terminated & Reconciled');
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleAddCustomer = async (formData: FormData) => {
        const res = await createCustomer(formData);
        if (res.success) {
            toast.success("Profile Provisioned");
            setIsAddCustomerModalOpen(false);
            setSelectedCustomer(res.customer);
            router.refresh();
        } else {
            toast.error(res.error || "Provisioning failed");
        }
    };

    // --- Render ---
    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
            
            {/* --- Top Navigation Bar --- */}
            <header className="h-20 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Store size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 leading-none">Point of Sale</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Store#{shopId.slice(-4).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
                        <div className={cn("w-2 h-2 rounded-full", shift ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            {shift ? `Active Shift: ${new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}` : "Shift Required"}
                        </span>
                        <button 
                            onClick={() => setIsShiftModalOpen(true)}
                            className="ml-2 p-1 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator Session</span>
                        <span className="text-xs font-bold text-slate-700 capitalize">Authorized Terminal</span>
                    </div>
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-1 flex overflow-hidden relative">
                
                {/* Catalog Section */}
                <section className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out",
                    activeTab !== 'catalog' ? "hidden md:flex" : "flex"
                )}>
                    {/* Controls Header */}
                    <div className="p-6 space-y-6 shrink-0 bg-slate-50/50">
                        <div className="flex gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                                <Input
                                    className="w-full pl-12 h-14 bg-white border-slate-200 rounded-[1.25rem] text-sm font-bold placeholder:text-slate-300 focus-visible:ring-indigo-500/10 focus:border-indigo-600/50 transition-all shadow-sm"
                                    placeholder="Search catalog or scan..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => setShowScanner(true)}
                                className="w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] shadow-xl shadow-slate-900/10 transition-transform active:scale-95"
                            >
                                <Scan size={24} />
                            </Button>
                        </div>

                        {/* Category Badges */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                            <button
                                onClick={() => setSelectedCategory('ALL')}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                                    selectedCategory === 'ALL'
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10"
                                        : "bg-white text-slate-400 border-slate-200 hover:border-indigo-200"
                                )}
                            >
                                All Items
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                                        selectedCategory === cat.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10"
                                            : "bg-white text-slate-400 border-slate-200 hover:border-indigo-200"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <ScrollArea className="flex-1 px-6 pb-24">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => {
                                const stock = product.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                                const originalPriceRaw = Number(product.price) || 0;
                                const currentPriceRaw = getPriceRaw(product);
                                const currentPrice = currentPriceRaw * rate;
                                const hasDiscount = currentPriceRaw < originalPriceRaw;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer active:scale-95 flex flex-col"
                                    >
                                        <div className="relative aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                                    <Box size={40} className="text-slate-400" />
                                                </div>
                                            )}
                                            
                                            {hasDiscount && (
                                                <div className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-bold uppercase px-2 py-1 rounded-lg shadow-lg">Sale</div>
                                            )}

                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center">
                                                    <Plus size={20} />
                                                </div>
                                            </div>

                                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5 shadow-sm">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", stock < 10 ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                                <span className="text-[10px] font-bold text-slate-600 font-mono tracking-tighter">{stock}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 flex flex-col gap-2">
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{product.sku}</p>
                                                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 h-8 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{product.name}</h3>
                                            </div>
                                            
                                            <div className="flex flex-col mt-auto">
                                                {hasDiscount && (
                                                    <span className="text-[9px] line-through text-slate-300 font-bold mb-0.5">{symbol}{(originalPriceRaw * rate).toFixed(2)}</span>
                                                )}
                                                <div className="text-lg font-bold text-slate-900 tabular-nums tracking-tight">
                                                    <span className="text-xs text-slate-400 mr-0.5">{symbol}</span>
                                                    {Math.floor(currentPrice)}
                                                    <span className="text-xs opacity-30">.{currentPrice.toFixed(2).split('.')[1]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[2.5rem] border border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-200">
                                    <ActivityIcon size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">No Items Found</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-6">Modify your search query or filter by a different category</p>
                            </div>
                        )}
                    </ScrollArea>
                </section>

                {/* Sidebar Section */}
                <aside className={cn(
                    "md:w-[450px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 transition-all duration-300",
                    activeTab === 'catalog' ? "hidden md:flex" : "flex flex-1"
                )}>
                    {/* Customer Selection */}
                    <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                        {selectedCustomer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Customer</p>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight h-5 overflow-hidden">{selectedCustomer.name}</h4>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                    <select
                                        value={selectedCustomer?.id || ''}
                                        onChange={(e) => {
                                            const c = customers.find(cust => cust.id === e.target.value);
                                            setSelectedCustomer(c || null);
                                        }}
                                        className="w-full h-14 pl-10 pr-10 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-900 outline-none hover:border-indigo-400 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">[ Walk-in Customer ]</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => setIsAddCustomerModalOpen(true)}
                                    className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                >
                                    <UserPlus size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <ScrollArea className="flex-1 bg-white">
                        <div className="p-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center opacity-30 grayscale">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                        <ShoppingCart size={32} className="text-slate-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Cart is Empty</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-10">Select products from the catalog to build your transaction</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="group p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                                    {item.product.imageUrl ? (
                                                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                                    ) : <Box size={24} className="m-auto mt-4 text-slate-200" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate italic">{item.product.name}</h4>
                                                        <span className="text-xs font-bold text-slate-900 ml-4 font-mono">{symbol}{(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                                                            <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-600"><Minus size={10} strokeWidth={4} /></button>
                                                            <span className="w-8 text-center text-xs font-bold text-slate-900 font-mono italic">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-600"><Plus size={10} strokeWidth={4} /></button>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">@{symbol}{item.price.toFixed(2)}</span>
                                                            <button onClick={() => removeFromCart(item.product.id)} className="text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Summary & Checkout */}
                    <div className="p-8 bg-slate-900 text-white shrink-0 mt-auto rounded-t-[2.5rem] shadow-2xl relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-3 w-12 h-1 bg-white/10 rounded-full" />
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1 border-l-2 border-indigo-500">Transaction Summary</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.reduce((a, b) => a + b.quantity, 0)} Items Registered</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl lg:text-5xl font-bold tracking-tighter italic font-mono flex items-baseline justify-end leading-none">
                                        <span className="text-lg lg:text-xl text-indigo-500 not-italic mr-1 opacity-60 font-sans tracking-normal">{symbol}</span>
                                        {total.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || loading}
                                className={cn(
                                    "w-full h-16 lg:h-20 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-bold text-base uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all border-none flex items-center justify-center gap-4 relative overflow-hidden group",
                                    loading && "opacity-80"
                                )}
                            >
                                {loading ? <ActivityIcon className="animate-spin" size={24} /> : (
                                    <>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                                        <span className="relative z-10 flex items-center gap-4">
                                            <CreditCard size={20} />
                                            Complete Order
                                            <ChevronRight size={18} />
                                        </span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* --- Bottom Navigation (Mobile Only) --- */}
            <div className="md:hidden h-20 bg-white border-t border-slate-200 flex items-center px-4 shrink-0 shadow-2xl z-50">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-slate-100 rounded-2xl h-14 p-1">
                        <TabsTrigger value="catalog" className="rounded-xl flex flex-col gap-0.5 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
                            <Box size={18} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Catalog</span>
                        </TabsTrigger>
                        <TabsTrigger value="cart" className="rounded-xl flex flex-col gap-0.5 py-1.5 relative data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
                            <div className="relative">
                                <ShoppingCart size={18} />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 bg-indigo-600 text-white w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center border-2 border-white">{cart.length}</span>
                                )}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest">Cart</span>
                        </TabsTrigger>
                        <TabsTrigger value="pay" className="rounded-xl flex flex-col gap-0.5 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
                            <CreditCard size={18} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Pay</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* --- Modals --- */}
            
            {/* Scanner */}
            {showScanner && <BarcodeScanner onScan={onScan} onClose={() => setShowScanner(false)} />}

            {/* ShiftPortal */}
            <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
                <DialogContent className="max-w-sm rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <div className="bg-slate-900 p-8 text-white">
                        <DialogTitle className="text-2xl font-bold uppercase italic tracking-tight flex items-center gap-3">
                            <Clock className="text-indigo-500" />
                            Shift Terminal
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal session management</DialogDescription>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        {!shift ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Starting Cash (Float)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="number"
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(e.target.value)}
                                            className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono italic"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleOpenShift} disabled={loading || !openingCash} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest italic flex gap-3">
                                    {loading ? <ActivityIcon className="animate-spin" /> : <Unlock size={18}/>} Open Terminal
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono italic">
                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">Active since</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{new Date(shift.openedAt).toLocaleString().toUpperCase()}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Counted Cash @ Close</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="number"
                                            value={closingCash}
                                            onChange={(e) => setClosingCash(e.target.value)}
                                            className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono italic"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleCloseShift} disabled={loading || !closingCash} className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-widest italic flex gap-3">
                                    {loading ? <ActivityIcon className="animate-spin" /> : <Lock size={18}/>} End Session
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Customer Add */}
            <Dialog open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen}>
                <DialogContent className="max-w-sm rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <div className="bg-slate-900 p-8 text-white">
                        <DialogTitle className="text-2xl font-bold uppercase italic tracking-tight">Profile Manager</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Register new client acquisition</DialogDescription>
                    </div>
                    <form action={handleAddCustomer} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <input name="name" required className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold font-mono focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder="FULL NAME / ENTITY" />
                            <input name="phone" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold font-mono focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder="CONTACT IDENTIFIER" />
                            <input name="email" type="email" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold font-mono focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder="DIGITAL EMAIL ADDRESS" />
                        </div>
                        <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest italic">
                            Provision Profile
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
