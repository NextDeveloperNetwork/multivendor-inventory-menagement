'use client';

import { useState, useMemo } from 'react';
import { Package, Search, ArrowUpDown, Copy } from 'lucide-react';


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
        <div className="space-y-6 md:space-y-12 bg-white p-2 md:p-4">
            {/* Filters Bar */}
            <div className="bg-blue-50 p-4 md:p-8 border-2 border-blue-100 shadow-xl shadow-blue-500/5 rounded-2xl md:rounded-3xl flex flex-col lg:flex-row gap-4 md:gap-8 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 md:pl-14 pr-4 md:pr-6 h-12 md:h-16 bg-white border-2 border-blue-100 rounded-xl md:rounded-2xl text-sm font-bold placeholder:text-blue-200 focus:border-blue-400 transition-all outline-none text-black"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-6 w-full lg:w-auto">
                    <select
                        className="h-12 md:h-16 px-4 md:px-8 bg-white border-2 border-blue-100 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest outline-none focus:border-blue-400 appearance-none min-w-[180px] md:min-w-[220px] text-black"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">ALL ITEMS</option>
                        <option value="in">IN STOCK</option>
                        <option value="low">LOW STOCK</option>
                        <option value="out">OUT OF STOCK</option>
                    </select>

                    <div className="flex bg-white p-1 md:p-1.5 rounded-xl md:rounded-2xl border-2 border-blue-100 shadow-sm">
                        {[
                            { id: 'name', label: 'NAME' },
                            { id: 'quantity', label: 'QTY' },
                            { id: 'value', label: 'VALUE' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => toggleSort(btn.id)}
                                className={`px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all tracking-widest ${sortBy === btn.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-blue-300 hover:text-blue-500'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inventory Display */}
            <div className="bg-white border-2 border-blue-100 rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-blue-500/5 overflow-hidden">
                <div className="p-4 md:p-10 border-b border-blue-50 bg-blue-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-6">
                    <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3 md:gap-4 text-black italic">
                        <Package size={24} className="text-blue-500 md:hidden" />
                        <Package size={28} className="text-blue-500 hidden md:block" />
                        Inventory ({filteredInventory.length})
                    </h3>
                    {filteredInventory.length !== inventory.length && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); }}
                            className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white border-2 border-blue-100 text-blue-400 px-4 md:px-6 py-2 md:py-3 rounded-xl hover:border-blue-400 hover:text-blue-500 transition-all shadow-sm"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden p-3 md:p-4 space-y-3 md:space-y-4">
                    {filteredInventory.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                                    <Search size={32} className="text-blue-200" />
                                </div>
                                <p className="text-xs font-bold text-blue-200 uppercase tracking-[0.3em]">No Items Found</p>
                            </div>
                        </div>
                    ) : (
                        filteredInventory.map((item) => {
                            const itemValue = item.quantity * Number(item.product.price);
                            const isLowStock = item.quantity < 10 && item.quantity > 0;
                            const isOutOfStock = item.quantity === 0;

                            return (
                                <div key={item.id} className="bg-blue-50/30 border-2 border-blue-100 rounded-xl md:rounded-2xl p-3 md:p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-black uppercase tracking-tight text-sm leading-tight truncate">{item.product.name}</div>
                                            {item.product.category && (
                                                <div className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mt-1">
                                                    {item.product.category}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => printBarcode(item.product)}
                                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm shrink-0"
                                            title="Print Barcode"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] font-black bg-blue-100 px-2 py-1 rounded-lg text-blue-500 font-mono tracking-wider">
                                            {item.product.sku}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOutOfStock
                                            ? 'bg-red-50 text-red-500'
                                            : isLowStock
                                                ? 'bg-amber-50 text-amber-500'
                                                : 'bg-emerald-50 text-emerald-500'
                                            }`}>
                                            {isOutOfStock ? 'Out' : isLowStock ? 'Low' : 'OK'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-100">
                                        <div>
                                            <div className="text-[8px] font-bold text-blue-300 uppercase mb-1">Price</div>
                                            <div className="text-sm font-black text-black font-mono">${Number(item.product.price).toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-bold text-blue-300 uppercase mb-1">Qty</div>
                                            <div className={`text-lg font-black font-mono ${isOutOfStock ? 'text-red-400' : 'text-black'}`}>{item.quantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-bold text-blue-300 uppercase mb-1">Value</div>
                                            <div className="text-sm font-black text-black font-mono">${itemValue.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white border-b-2 border-blue-50">
                                <th className="px-10 py-6 text-left text-[11px] font-black uppercase tracking-widest text-blue-300 cursor-pointer hover:text-black transition-colors" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-3">PRODUCT <ArrowUpDown size={14} /></div>
                                </th>
                                <th className="px-10 py-6 text-left text-[11px] font-black uppercase tracking-widest text-blue-300">SKU</th>
                                <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-widest text-blue-300 cursor-pointer hover:text-black transition-colors" onClick={() => toggleSort('price')}>
                                    <div className="flex items-center justify-end gap-3">PRICE <ArrowUpDown size={14} /></div>
                                </th>
                                <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-widest text-blue-300 cursor-pointer hover:text-black transition-colors" onClick={() => toggleSort('quantity')}>
                                    <div className="flex items-center justify-end gap-3">QTY <ArrowUpDown size={14} /></div>
                                </th>
                                <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-widest text-blue-300 cursor-pointer hover:text-black transition-colors" onClick={() => toggleSort('value')}>
                                    <div className="flex items-center justify-end gap-3">VALUE <ArrowUpDown size={14} /></div>
                                </th>
                                <th className="px-10 py-6 text-center text-[11px] font-black uppercase tracking-widest text-blue-300">STATUS</th>
                                <th className="px-10 py-6 text-center text-[11px] font-black uppercase tracking-widest text-blue-300">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-t border-blue-50">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                                                <Search size={36} className="text-blue-200" />
                                            </div>
                                            <p className="text-xs font-bold text-blue-200 uppercase tracking-[0.3em]">No Items Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => {
                                    const itemValue = item.quantity * Number(item.product.price);
                                    const isLowStock = item.quantity < 10 && item.quantity > 0;
                                    const isOutOfStock = item.quantity === 0;

                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="font-bold text-black uppercase tracking-tight text-sm leading-tight hover:translate-x-1 transition-transform">{item.product.name}</div>
                                                {item.product.category && (
                                                    <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-2">
                                                        {item.product.category}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] font-black bg-blue-50 px-3 py-1.5 rounded-lg text-blue-400 font-mono tracking-wider">
                                                    {item.product.sku}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right font-black text-black font-mono tracking-tighter">
                                                {symbol}{(Number(item.product.price) * rate).toFixed(2)}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <span className={`text-2xl font-black font-mono tracking-tighter ${isOutOfStock ? 'text-blue-100' : 'text-black'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="text-xl font-black text-black font-mono tracking-tighter italic underline decoration-blue-500 decoration-1 underline-offset-8">
                                                    {symbol}{(itemValue * rate).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${isOutOfStock
                                                    ? 'bg-red-50 text-red-500 border border-red-100'
                                                    : isLowStock
                                                        ? 'bg-amber-50 text-amber-500 border border-amber-100'
                                                        : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
                                                    }`}>
                                                    {isOutOfStock ? 'Out' : isLowStock ? 'Low' : 'OK'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <button
                                                    onClick={() => printBarcode(item.product)}
                                                    className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-100 hover:border-blue-500"
                                                    title="Print Barcode"
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
