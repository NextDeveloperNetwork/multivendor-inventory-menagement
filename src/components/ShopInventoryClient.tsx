'use client';

import { useState, useMemo } from 'react';
import { Package, Search, ArrowUpDown, Copy, Barcode } from 'lucide-react';

interface ShopInventoryClientProps {
    inventory: any[];
    currency: {
        symbol: string;
        rate: number;
    };
}

export default function ShopInventoryClient({ inventory, currency }: ShopInventoryClientProps) {
    const rate = currency?.rate || 1;
    const symbol = currency?.symbol || 'ALL';

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
                await navigator.clipboard.writeText(barcodeValue);
            } else {
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
        <div className="space-y-6 fade-in">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="in">In Stock</option>
                        <option value="low">Low Stock</option>
                        <option value="out">Out of Stock</option>
                    </select>

                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {[
                            { id: 'name', label: 'Name' },
                            { id: 'quantity', label: 'Qty' },
                            { id: 'value', label: 'Value' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => toggleSort(btn.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    sortBy === btn.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-2">Product <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-4 py-4">SKU / Code</th>
                                <th className="px-4 py-4 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => toggleSort('price')}>
                                    <div className="flex items-center justify-end gap-2">Price <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => toggleSort('quantity')}>
                                    <div className="flex items-center justify-end gap-2">Stock <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => toggleSort('value')}>
                                    <div className="flex items-center justify-end gap-2">Total Value <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-4 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <Search size={32} strokeWidth={1.5} className="mb-3" />
                                            <p className="font-semibold text-slate-500">No products found matching criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => {
                                    const val = item.quantity * Number(item.product.price);
                                    const out = item.quantity === 0;
                                    const low = item.quantity > 0 && item.quantity < 10;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{item.product.name}</p>
                                                {item.product.category && (
                                                    <p className="text-xs text-slate-400">{item.product.category.name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-500">
                                                    <Barcode size={12} /> {item.product.sku}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-semibold text-slate-900 font-mono">
                                                {symbol} {(Number(item.product.price) * rate).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-lg font-bold font-mono ${out ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-indigo-600 font-mono">
                                                {symbol} {(val * rate).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                    out ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                    low ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }`}>
                                                    {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={() => printBarcode(item.product)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Copy Barcode"
                                                >
                                                    <Copy size={16} />
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
