'use client';

import { useState, useMemo } from 'react';
import { Package, Search, ArrowUpDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";


interface ShopInventoryClientProps {
    inventory: any[];
    currency: {
        symbol: string;
        rate: number;
    };
}

export default function ShopInventoryClient({ inventory, currency }: ShopInventoryClientProps) {
    const rate = currency?.rate || 1;
    const symbol = currency?.symbol || '$';
    const router = useRouter();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const filteredInventory = useMemo(() => {
        return inventory
            .filter(item => {
                const matchesSearch = item.product.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.product.sku.toLowerCase().includes(search.toLowerCase());

                const isOutOfStock = item.quantity === 0;
                const isLowStock = item.quantity > 0 && item.quantity < 10;

                let matchesStatus = true;
                if (statusFilter === 'out') matchesStatus = isOutOfStock;
                else if (statusFilter === 'low') matchesStatus = isLowStock;
                else if (statusFilter === 'in') matchesStatus = !isOutOfStock && !isLowStock;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'name') comparison = a.product.name.localeCompare(b.product.name);
                else if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
                else if (sortBy === 'price') comparison = Number(a.product.price) - Number(b.product.price);
                else if (sortBy === 'value') comparison = (a.quantity * Number(a.product.price)) - (b.quantity * Number(b.product.price));

                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [inventory, search, statusFilter, sortBy, sortOrder]);

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const printBarcode = async (product: any) => {
        const barcodeValue = product.barcode || product.sku;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                // Modern clipboard API (HTTPS)
                await navigator.clipboard.writeText(barcodeValue);
            } else {
                // Fallback for older browsers / HTTP
                const textArea = document.createElement('textarea');
                textArea.value = barcodeValue;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            alert(`Barcode copied:\n${barcodeValue}`);
        } catch (err) {
            console.error('Failed to copy barcode:', err);
            alert('Failed to copy barcode');
        }
    };



    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Search & Filter Controls */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        className="w-full pl-14 pr-6 h-16 bg-white border border-slate-200 rounded-2xl text-sm font-semibold placeholder:text-slate-300 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <select
                        className="h-16 px-8 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-indigo-500/50 appearance-none min-w-[200px] text-slate-900 shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">STATUS: ALL PRODUCTS</option>
                        <option value="in">STATUS: IN STOCK</option>
                        <option value="low">STATUS: LOW STOCK</option>
                        <option value="out">STATUS: OUT OF STOCK</option>
                    </select>

                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        {[
                            { id: 'name', label: 'NAME' },
                            { id: 'quantity', label: 'QUANTITY' },
                            { id: 'value', label: 'VALUATION' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => toggleSort(btn.id)}
                                className={`px-6 py-3 rounded-xl text-[9px] font-bold transition-all tracking-widest ${sortBy === btn.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inventory Registry */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <Package size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">
                                Inventory Asset Registry
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Direct stock audit: {filteredInventory.length} products total</p>
                        </div>
                    </div>
                    {filteredInventory.length !== inventory.length && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); }}
                            className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 border border-slate-200 text-slate-500 px-6 py-3 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Mobile Interface */}
                <div className="block lg:hidden p-4 space-y-4">
                    {filteredInventory.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                                <Search size={32} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No products found</p>
                        </div>
                    ) : (
                        filteredInventory.map((item) => {
                            const itemValue = item.quantity * Number(item.product.price);
                            const isLowStock = item.quantity < 10 && item.quantity > 0;
                            const isOutOfStock = item.quantity === 0;

                            return (
                                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 hover:bg-white hover:border-blue-500/30 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-900 uppercase tracking-tight text-sm leading-tight leading-none">{item.product.name}</div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[8px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400 font-mono">
                                                    {item.product.sku}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${isOutOfStock
                                                    ? 'bg-rose-50 text-rose-500 border-rose-100'
                                                    : isLowStock
                                                        ? 'bg-amber-50 text-amber-500 border-amber-100'
                                                        : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                                                    }`}>
                                                    {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => printBarcode(item.product)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-black/10">
                                            <Copy size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-200 items-baseline">
                                        <div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Cost</div>
                                            <div className="text-xs font-bold text-slate-900 font-mono tracking-tight">{symbol}{Number(item.product.price || 0).toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</div>
                                            <div className={`text-xl font-bold font-mono tracking-tight ${isOutOfStock ? 'text-rose-500' : 'text-slate-900'}`}>{item.quantity}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
                                            <div className="text-xs font-bold text-indigo-600 font-mono tracking-tight">{symbol}{(itemValue || 0).toFixed(2)}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => printBarcode(item.product)}
                                        className="w-full h-12 bg-white text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        <Copy size={16} /> Copy SKU Identifier
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Interface */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-3">Product Name <ArrowUpDown size={12} className="text-indigo-500" /></div>
                                </th>
                                <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">SKU Code</th>
                                <th className="px-10 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => toggleSort('price')}>
                                    <div className="flex items-center justify-end gap-3">Unit Price <ArrowUpDown size={12} className="text-indigo-500" /></div>
                                </th>
                                <th className="px-10 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => toggleSort('quantity')}>
                                    <div className="flex items-center justify-end gap-3">Quantity <ArrowUpDown size={12} className="text-indigo-500" /></div>
                                </th>
                                <th className="px-10 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => toggleSort('value')}>
                                    <div className="flex items-center justify-end gap-3">Total Value <ArrowUpDown size={12} className="text-indigo-500" /></div>
                                </th>
                                <th className="px-10 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-10 py-6 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                                                <Search size={36} className="text-slate-200" />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No products match your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => {
                                    const itemValue = item.quantity * Number(item.product.price);
                                    const isLowStock = item.quantity < 10 && item.quantity > 0;
                                    const isOutOfStock = item.quantity === 0;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="font-bold text-slate-900 uppercase tracking-tight text-sm leading-tight leading-none group-hover:translate-x-1 transition-transform">{item.product.name}</div>
                                                {item.product.category?.name && (
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 border-l-2 border-indigo-500/30 pl-2">
                                                        {item.product.category.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 font-mono tracking-wider shadow-sm">
                                                    {item.product.sku}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right font-bold text-slate-900 font-mono tracking-tight text-sm">
                                                {symbol}{(Number(item.product.price || 0) * rate).toFixed(2)}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <span className={`text-2xl font-bold font-mono tracking-tight ${isOutOfStock ? 'text-rose-500' : 'text-slate-900'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="text-lg font-bold text-indigo-600 font-mono tracking-tight">
                                                    {symbol}{((itemValue || 0) * rate).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${isOutOfStock
                                                    ? 'bg-rose-50 text-rose-500 border-rose-100'
                                                    : isLowStock
                                                        ? 'bg-amber-50 text-amber-500 border-amber-100'
                                                        : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                                                    }`}>
                                                    {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button
                                                    onClick={() => printBarcode(item.product)}
                                                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-black/10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                                    title="Copy Identifier"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
