'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { generateSKU } from '@/lib/utils';
import { manualBulkCreateProducts } from '@/app/actions/inventory';

interface BulkAddClientProps {
    selectedBusinessId: string | null;
    shops: any[];
    warehouses: any[];
}

interface ProductRow {
    name: string;
    sku: string;
    price: string;
    cost: string;
    initialStock: string;
}

export default function BulkAddClient({ selectedBusinessId, shops, warehouses }: BulkAddClientProps) {
    const router = useRouter();
    const [rows, setRows] = useState<ProductRow[]>([
        { name: '', sku: '', price: '', cost: '', initialStock: '' }
    ]);
    const [targetType, setTargetType] = useState<'warehouse' | 'shop'>('warehouse');
    const [targetId, setTargetId] = useState('');
    const [loading, setLoading] = useState(false);

    const addRow = () => {
        setRows([...rows, { name: '', sku: '', price: '', cost: '', initialStock: '' }]);
    };

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, field: keyof ProductRow, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleGenerateSKU = (index: number) => {
        const product = rows[index];
        if (!product.name) {
            toast.error("Enter a product name first to generate SKU");
            return;
        }
        updateRow(index, 'sku', generateSKU(product.name));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        const validRows = rows.filter(r => r.name && r.sku && r.price && r.cost);
        if (validRows.length === 0) {
            toast.error("Please fill in at least one product row with all details.");
            return;
        }

        if (rows.some(r => r.initialStock && parseInt(r.initialStock) > 0) && !targetId) {
            toast.error("Please select a destination for initial stock.");
            return;
        }

        setLoading(true);
        const res = await manualBulkCreateProducts(validRows, {
            businessId: selectedBusinessId,
            targetType,
            targetId
        });

        if (res.success) {
            toast.success(`Successfully created ${res.count} products`);
            router.push('/admin/inventory');
            router.refresh();
        } else {
            toast.error(res.error || "Failed to create products");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/inventory" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900 shadow-sm">
                        <ArrowLeft size={20} className="stroke-[2.5]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Bulk <span className="text-primary">Matrix</span> Add</h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 italic">
                            <Package size={14} className="text-primary" /> Rapid deployment of multi-asset identifiers
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        <button
                            type="button"
                            onClick={() => { setTargetType('warehouse'); setTargetId(''); }}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${targetType === 'warehouse' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                            Warehouse
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTargetType('shop'); setTargetId(''); }}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${targetType === 'shop' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                            Shop
                        </button>
                    </div>
                    <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-900 focus:border-primary outline-none transition-all uppercase italic min-w-[200px]"
                    >
                        <option value="">No Stock / Default...</option>
                        {(targetType === 'warehouse' ? warehouses : shops).map(item => (
                            <option key={item.id} value={item.id}>{item.name.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">#</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Article Name</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">SKU identifier</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Price</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Cost</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Initial Stock</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.map((row, index) => (
                                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-black text-slate-300 italic">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            value={row.name}
                                            onChange={(e) => updateRow(index, 'name', e.target.value)}
                                            required
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:border-primary focus:bg-white outline-none transition-all uppercase italic"
                                            placeholder="Product Name..."
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group/sku">
                                            <input
                                                value={row.sku}
                                                onChange={(e) => updateRow(index, 'sku', e.target.value)}
                                                required
                                                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:border-primary focus:bg-white outline-none transition-all uppercase italic pr-10"
                                                placeholder="SKU-CODE"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleGenerateSKU(index)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-100 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center opacity-0 group-hover/sku:opacity-100"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.price}
                                            onChange={(e) => updateRow(index, 'price', e.target.value)}
                                            required
                                            className="w-24 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.cost}
                                            onChange={(e) => updateRow(index, 'cost', e.target.value)}
                                            required
                                            className="w-24 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            value={row.initialStock}
                                            onChange={(e) => updateRow(index, 'initialStock', e.target.value)}
                                            className="w-24 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all font-mono"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            disabled={rows.length === 1}
                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-0"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={addRow}
                            className="w-full h-14 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:border-primary hover:text-primary transition-all group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            Append New Registry Row
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-6 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-20 px-16 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-black/10 hover:bg-primary transition-all active:scale-95 disabled:opacity-30 flex items-center gap-4 italic"
                    >
                        {loading ? (
                            <span className="block w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={20} className="stroke-[3]" />
                        )}
                        Commit Matrix Registry
                    </button>
                </div>
            </form>
        </div>
    );
}
