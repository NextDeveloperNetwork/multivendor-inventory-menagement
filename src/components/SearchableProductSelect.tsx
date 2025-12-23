'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Package, Plus } from 'lucide-react';
import QuickAddProductDialog from './QuickAddProductDialog';

interface Product {
    id: string;
    name: string;
    sku: string;
    cost?: any;
}

interface SearchableProductSelectProps {
    products: Product[];
    value: string;
    onChange: (id: string, cost: string) => void;
    onProductCreated: (product: any) => void;
    placeholder?: string;
}

export default function SearchableProductSelect({ products, value, onChange, onProductCreated, placeholder = "Identify Asset..." }: SearchableProductSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedProduct = products.find(p => p.id === value);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setOpen(!open)}
                className={`w-full h-12 px-4 bg-slate-50 border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${open ? 'border-blue-400' : 'border-slate-100'}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Package size={14} className={selectedProduct ? 'text-blue-500' : 'text-slate-300'} />
                    <span className={`text-xs font-bold truncate ${selectedProduct ? 'text-black' : 'text-slate-400'}`}>
                        {selectedProduct ? `${selectedProduct.name} [${selectedProduct.sku}]` : placeholder}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && (
                <div className="absolute z-50 top-full left-0 w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 bg-slate-50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder="Filter products..."
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredProducts.length === 0 ? (
                            <div className="p-8 text-center space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">
                                    Asset Not Registered<br />in Global Registry
                                </p>
                                <div className="pt-2 border-t border-slate-50">
                                    <QuickAddProductDialog onAdd={(p) => {
                                        onProductCreated(p);
                                        setOpen(false);
                                    }} />
                                </div>
                            </div>
                        ) : (
                            filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => {
                                        onChange(product.id, product.cost?.toString() || '');
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full p-4 rounded-xl flex flex-col gap-1 cursor-pointer transition-colors ${value === product.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                >
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{product.name}</span>
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{product.sku}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
