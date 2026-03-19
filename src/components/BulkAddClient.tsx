'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { generateSKU } from '@/lib/utils';
import { manualBulkCreateProducts, createCategory, createUnit } from '@/app/actions/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BulkAddClientProps {
    selectedBusinessId: string | null;
    shops: any[];
    warehouses: any[];
    categories: any[];
    units: any[];
}

interface ProductRow {
    name: string;
    sku: string;
    price: string;
    cost: string;
    initialStock: string;
    categoryId: string;
    unitId: string;
    isPriceManual?: boolean;
}

export default function BulkAddClient({ selectedBusinessId, shops, warehouses, categories: initialCategories = [], units: initialUnits = [] }: BulkAddClientProps) {
    const router = useRouter();
    const [rows, setRows] = useState<ProductRow[]>([
        { name: '', sku: '', price: '', cost: '', initialStock: '', categoryId: '', unitId: '', isPriceManual: false }
    ]);
    const [targetType, setTargetType] = useState<'warehouse' | 'shop'>('warehouse');
    const [targetId, setTargetId] = useState('');
    const [loading, setLoading] = useState(false);

    // Dialog states
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [localCategories, setLocalCategories] = useState(initialCategories);
    const [localUnits, setLocalUnits] = useState(initialUnits);

    const addRow = () => {
        setRows([...rows, { name: '', sku: '', price: '', cost: '', initialStock: '', categoryId: '', unitId: '', isPriceManual: false }]);
    };

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, field: keyof ProductRow, value: any) => {
        const newRows = [...rows];
        const row = { ...newRows[index], [field]: value };
        
        if (field === 'price') {
            row.isPriceManual = true;
        }
        
        if (field === 'cost' && !row.isPriceManual && value) {
            row.price = (Number(value) * 1.4).toFixed(2);
        }

        newRows[index] = row;
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

        // Basic validation - price/cost optional now
        const validRows = rows.filter(r => r.name && r.sku);
        if (validRows.length === 0) {
            toast.error("Please fill in at least one product name and SKU.");
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

            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => setIsCategoryDialogOpen(true)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95 italic"
                >
                    <Plus size={16} /> New Category
                </button>
                <button
                    type="button"
                    onClick={() => setIsUnitDialogOpen(true)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95 italic"
                >
                    <Plus size={16} /> New Unit
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">#</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Article Name</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Identifiers</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Category / Unit</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Price / Cost</th>
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
                                        <div className="flex flex-col gap-2">
                                            <div className="relative">
                                                <input
                                                    value={row.sku}
                                                    onChange={(e) => updateRow(index, 'sku', e.target.value)}
                                                    required
                                                    className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-900 focus:border-primary focus:bg-white outline-none transition-all uppercase italic pr-10"
                                                    placeholder="SKU-CODE"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateSKU(index)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-100 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                >
                                                    <RefreshCw size={12} />
                                                </button>
                                            </div>
                                            <input
                                                value={row.initialStock}
                                                type="number"
                                                onChange={(e) => updateRow(index, 'initialStock', e.target.value)}
                                                className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all font-mono"
                                                placeholder="START_STOCK"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <select
                                                value={row.categoryId}
                                                onChange={(e) => updateRow(index, 'categoryId', e.target.value)}
                                                className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-900 focus:border-primary outline-none transition-all uppercase italic"
                                            >
                                                <option value="">CATEGORY</option>
                                                {localCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                            <select
                                                value={row.unitId}
                                                onChange={(e) => updateRow(index, 'unitId', e.target.value)}
                                                className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-900 focus:border-primary outline-none transition-all uppercase italic"
                                            >
                                                <option value="">UNIT</option>
                                                {localUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.price}
                                                onChange={(e) => updateRow(index, 'price', e.target.value)}
                                                className="w-24 h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all font-mono"
                                                placeholder="SELL_PRC"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.cost}
                                                onChange={(e) => updateRow(index, 'cost', e.target.value)}
                                                className="w-24 h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all font-mono"
                                                placeholder="BUY_COST"
                                            />
                                        </div>
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

            <CategoryUnitDialog
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                title="Define New Category"
                value={newCategoryName}
                onChange={setNewCategoryName}
                onAdd={async () => {
                    const res = await createCategory(newCategoryName, selectedBusinessId);
                    if (res.success) {
                        setLocalCategories([...localCategories, res.category]);
                        setNewCategoryName('');
                        setIsCategoryDialogOpen(false);
                        toast.success('Category created');
                    }
                }}
            />

            <CategoryUnitDialog
                isOpen={isUnitDialogOpen}
                onClose={() => setIsUnitDialogOpen(false)}
                title="Define New Unit"
                value={newUnitName}
                onChange={setNewUnitName}
                onAdd={async () => {
                    const res = await createUnit(newUnitName, selectedBusinessId);
                    if (res.success) {
                        setLocalUnits([...localUnits, res.unit]);
                        setNewUnitName('');
                        setIsUnitDialogOpen(false);
                        toast.success('Unit created');
                    }
                }}
            />
        </div>
    );
}

function CategoryUnitDialog({ isOpen, onClose, title, value, onChange, onAdd }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white p-8 rounded-[2.5rem] border-none shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Name / Descriptor</label>
                        <input
                            autoFocus
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                            className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-900 focus:border-primary focus:bg-white outline-none transition-all uppercase italic"
                            placeholder="Type identifier..."
                        />
                    </div>
                    <div className="flex gap-4 justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onAdd}
                            disabled={!value.trim()}
                            className="h-12 px-10 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shadow-lg active:scale-95 italic"
                        >
                            Create Entity
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
