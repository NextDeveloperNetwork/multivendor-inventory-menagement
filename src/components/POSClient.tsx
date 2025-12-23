'use client';

import { useState } from 'react';
import { Product, Inventory } from '@prisma/client';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { processSale } from '@/app/actions/sales';
import { useRouter } from 'next/navigation';
import BarcodeScanner from './BarcodeScanner';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

type ProductWithInventory = Product & { inventory: Inventory[] };

interface SaleInterfaceProps {
    products: ProductWithInventory[];
    shopId: string;
}

interface CartItem {
    product: ProductWithInventory;
    quantity: number;
}

export default function POSInterface({ products, shopId }: SaleInterfaceProps) {
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const router = useRouter();

    // Filter products based on search and if they have stock in THIS shop
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
                if (existing.quantity >= stock) return prev; // prevent overselling locally

                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
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

                // Check stock limit
                const product = products.find(p => p.id === productId);
                const stock = product?.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                if (newQty > stock) return item;

                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum: number, item: CartItem) => sum + (Number(item.product.price) * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);

        const saleItems = cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: Number(item.product.price)
        }));

        const res = await processSale(saleItems);

        if (res.error) {
            toast.error(res.error);
            setLoading(false);
        } else {
            toast.success('Sale completed successfully!');
            setCart([]);
            router.refresh(); // Refresh to update inventory numbers
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:gap-10 min-h-[calc(100vh-120px)] bg-white p-2 md:p-4">
            {/* Product Selection */}
            <div className="flex-1 flex flex-col gap-4 md:gap-8 order-2 lg:order-1">
                <div className="flex gap-2 md:gap-4">
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            autoFocus
                            className="w-full pl-10 md:pl-14 pr-3 md:pr-6 h-12 md:h-16 bg-blue-50/50 border-2 border-blue-100 rounded-xl md:rounded-2xl text-sm md:text-lg font-bold placeholder:text-blue-200 focus:border-blue-400 focus:bg-white transition-all outline-none shadow-sm text-black"
                            placeholder="Search products..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowScanner(true)}
                        className="h-12 md:h-16 px-3 md:px-6 bg-blue-600 text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Camera size={20} />
                        <span className="hidden sm:inline font-black uppercase text-[10px] tracking-widest">Scan</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 overflow-y-auto pr-1 md:pr-4 pb-4 max-h-[45vh] lg:max-h-none">
                    {filteredProducts.map(product => {
                        const stock = product.inventory.find((inv: Inventory) => inv.shopId === shopId)?.quantity || 0;
                        return (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-blue-50 border-2 border-blue-100 p-3 md:p-6 rounded-xl md:rounded-3xl flex flex-col items-start hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left group relative active:scale-[0.98]"
                            >
                                <div className="font-bold text-black mb-1 md:mb-2 line-clamp-2 text-xs md:text-sm leading-snug uppercase tracking-tight">{product.name}</div>
                                <div className="text-[9px] md:text-[10px] text-blue-400 font-bold mb-3 md:mb-6 tracking-widest">{product.sku}</div>
                                <div className="mt-auto w-full flex justify-between items-end border-t border-blue-100/50 pt-2 md:pt-5">
                                    <span className="text-black font-black text-base md:text-xl font-mono tracking-tighter">${Number(product.price).toFixed(2)}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] md:text-[9px] font-bold text-blue-300 uppercase">STOCK</span>
                                        <span className="text-[10px] md:text-[11px] font-black text-black">{stock}</span>
                                    </div>
                                </div>
                                <div className="absolute top-2 md:top-4 right-2 md:right-4 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        );
                    })}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full bg-blue-50/30 border-2 border-dashed border-blue-100 rounded-3xl flex flex-col items-center justify-center p-24 text-center">
                            <Search size={48} className="text-blue-200 mb-6" />
                            <p className="text-black font-bold uppercase tracking-widest text-sm">No Results Detected</p>
                            <p className="text-blue-300 text-xs mt-2 font-medium">Clear search query or try a different node</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart - Fixed at top on mobile, sticky on desktop */}
            <div className="w-full lg:w-[480px] flex flex-col bg-white border-2 border-blue-100 rounded-xl md:rounded-[2.5rem] shadow-2xl shadow-blue-500/5 overflow-hidden order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start max-h-[40vh] lg:max-h-[calc(100vh-120px)]">
                <div className="p-4 md:p-10 border-b border-blue-50 bg-blue-50/50 flex justify-between items-center shrink-0">
                    <h2 className="text-lg md:text-2xl font-black flex items-center gap-2 md:gap-4 text-black tracking-tighter uppercase italic">
                        <ShoppingCart size={20} className="text-blue-500 md:hidden" />
                        <ShoppingCart size={28} className="text-blue-500 hidden md:block" />
                        Cart
                    </h2>
                    <span className="text-[10px] md:text-xs font-black bg-blue-500 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg shadow-blue-500/20">
                        {cart.length} ITEMS
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-3 md:space-y-6 bg-white">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-blue-100">
                            <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8">
                                <ShoppingCart size={48} />
                            </div>
                            <p className="text-xs font-bold text-blue-200 uppercase tracking-[0.4em]">Empty Registry</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="flex flex-col gap-3 md:gap-6 bg-blue-50/30 p-3 md:p-6 rounded-xl md:rounded-3xl border-2 border-blue-50 group hover:border-blue-200 hover:bg-white transition-all">
                                <div className="flex justify-between items-start gap-2 md:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-black uppercase tracking-tight text-xs md:text-sm leading-tight truncate">{item.product.name}</div>
                                        <div className="text-[9px] md:text-[10px] text-blue-400 font-bold tracking-widest mt-1 md:mt-2">${Number(item.product.price).toFixed(2)} / UNIT</div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-blue-200 hover:text-red-500 transition-colors p-1.5 md:p-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-blue-50 shrink-0">
                                        <Trash2 size={16} className="md:hidden" />
                                        <Trash2 size={18} className="hidden md:block" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between border-t border-blue-100/50 pt-3 md:pt-5">
                                    <div className="flex items-center bg-white border-2 border-blue-100 rounded-xl md:rounded-2xl overflow-hidden h-9 md:h-12 shadow-sm">
                                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-9 md:w-12 flex items-center justify-center hover:bg-blue-50 text-black transition-colors h-full"><Minus size={14} className="md:hidden" /><Minus size={16} className="hidden md:block" /></button>
                                        <span className="w-10 md:w-14 text-center text-xs md:text-sm font-black text-black border-x-2 border-blue-50 h-full flex items-center justify-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-9 md:w-12 flex items-center justify-center hover:bg-blue-50 text-black transition-colors h-full"><Plus size={14} className="md:hidden" /><Plus size={16} className="hidden md:block" /></button>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] md:text-[9px] font-bold text-blue-300 uppercase tracking-widest">SUBTOTAL</div>
                                        <div className="text-sm md:text-xl font-black text-black font-mono tracking-tighter">
                                            ${(Number(item.product.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 md:p-10 border-t border-blue-100 bg-blue-50/30 shrink-0">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                        <span className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest">Total</span>
                        <span className="text-2xl md:text-4xl font-black text-black font-mono tracking-tighter">${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || loading}
                        className="w-full h-12 md:h-16 bg-black text-white rounded-xl md:rounded-2xl font-bold shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] uppercase tracking-widest text-xs md:text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard size={18} className="md:hidden" />
                                <CreditCard size={20} className="hidden md:block" />
                                Checkout
                            </>
                        )}
                    </button>
                </div>
            </div>
            {showScanner && (
                <BarcodeScanner
                    onScan={(code) => {
                        const product = products.find(p => p.barcode === code || p.sku === code);
                        if (product) {
                            addToCart(product);
                            setShowScanner(false);
                            toast.success(`Added ${product.name} to cart`);
                        } else {
                            toast.error(`Product with code ${code} not found`);
                        }
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
