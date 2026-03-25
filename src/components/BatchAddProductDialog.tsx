'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, RefreshCw, X, Save, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { generateSKU } from '@/lib/utils';
import { manualBulkCreateProducts, createCategory, createUnit, getCategories, getUnits } from '@/app/actions/inventory';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

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

interface BatchAddProductDialogProps {
    selectedBusinessId: string | null;
    categories: any[];
    units: any[];
    onSuccess?: (count: number) => void;
}

export default function BatchAddProductDialog({
    selectedBusinessId,
    categories: initialCategories = [],
    units: initialUnits = [],
    onSuccess,
}: BatchAddProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<ProductRow[]>([
        { name: '', sku: '', price: '', cost: '', initialStock: '0', categoryId: '', unitId: '', isPriceManual: false }
    ]);
    const [loading, setLoading] = useState(false);

    // Dialog for new category/unit
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [localCategories, setLocalCategories] = useState<any[]>(initialCategories);
    const [localUnits, setLocalUnits] = useState<any[]>(initialUnits);

    // Refresh lists when props change
    useEffect(() => {
        setLocalCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
        setLocalUnits(initialUnits);
    }, [initialUnits]);

    const addRow = () => {
        setRows([...rows, { name: '', sku: '', price: '', cost: '', initialStock: '0', categoryId: '', unitId: '', isPriceManual: false }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
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
            toast.error("Enter name first");
            return;
        }
        updateRow(index, 'sku', generateSKU(product.name));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validRows = rows.filter(r => r.name && r.sku);
        if (validRows.length === 0) {
            toast.error("Add at least one product with name and SKU");
            return;
        }

        setLoading(true);
        const res = await manualBulkCreateProducts(validRows, {
            businessId: selectedBusinessId,
            targetType: 'warehouse',
            targetId: undefined
        });

        if (res.success) {
            toast.success(`Created ${res.count} products`);
            setOpen(false);
            setRows([{ name: '', sku: '', price: '', cost: '', initialStock: '0', categoryId: '', unitId: '', isPriceManual: false }]);
            if (onSuccess) onSuccess(res.count || 0);
        } else {
            toast.error(res.error || "Failed to create products");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                >
                    <Plus size={14} strokeWidth={3} /> Batch Add Products
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-[1400px] w-[95vw] p-0 flex flex-col bg-white overflow-hidden rounded-2xl border border-slate-200 shadow-2xl max-h-[90vh]">
                <DialogHeader className="px-8 py-6 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-900">
                            <Package size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-serif italic uppercase tracking-tight">Batch Matrix Deployment</DialogTitle>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rapid Article Creation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsCategoryDialogOpen(true)}
                            className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2"
                        >
                            <Plus size={12} /> New Category
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsUnitDialogOpen(true)}
                            className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2"
                        >
                            <Plus size={12} /> New Size/Unit
                        </button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto px-8 py-6">
                        <table className="w-full border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                    <th className="px-2 text-left">#</th>
                                    <th className="px-2 text-left">Product Name</th>
                                    <th className="px-2 text-left">SKU</th>
                                    <th className="px-2 text-left">Category</th>
                                    <th className="px-2 text-left">Unit</th>
                                    <th className="px-2 text-right">Cost</th>
                                    <th className="px-2 text-right">Price</th>
                                    <th className="px-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index} className="bg-slate-50/50 hover:bg-white transition-colors border border-slate-100/50 rounded-xl">
                                        <td className="px-2 py-2 text-[10px] font-black text-slate-300 italic">{index + 1}</td>
                                        <td className="px-2 py-2">
                                            <input
                                                value={row.name}
                                                onChange={(e) => updateRow(index, 'name', e.target.value)}
                                                required
                                                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-slate-900 outline-none transition-all uppercase placeholder:text-slate-300"
                                                placeholder="Article..."
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="relative">
                                                <input
                                                    value={row.sku}
                                                    onChange={(e) => updateRow(index, 'sku', e.target.value)}
                                                    required
                                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-900 focus:border-slate-900 outline-none transition-all uppercase placeholder:text-slate-300"
                                                    placeholder="SKU..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateSKU(index)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900"
                                                >
                                                    <RefreshCw size={10} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={row.categoryId}
                                                onChange={(e) => updateRow(index, 'categoryId', e.target.value)}
                                                className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 uppercase"
                                            >
                                                <option value="">Category</option>
                                                {localCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={row.unitId}
                                                onChange={(e) => updateRow(index, 'unitId', e.target.value)}
                                                className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 uppercase"
                                            >
                                                <option value="">Unit</option>
                                                {localUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.cost}
                                                onChange={(e) => updateRow(index, 'cost', e.target.value)}
                                                className="w-20 h-9 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-right font-black text-slate-900 outline-none focus:border-slate-900"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.price}
                                                onChange={(e) => updateRow(index, 'price', e.target.value)}
                                                className="w-20 h-9 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-right font-black text-slate-900 outline-none focus:border-slate-900"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(index)}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            type="button"
                            onClick={addRow}
                            className="w-full mt-4 h-12 bg-white border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:border-slate-900 hover:text-slate-900 transition-all group"
                        >
                            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                            Add Registry Row
                        </button>
                    </div>

                    <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                        >
                            Discard_Action
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-slate-900/10"
                        >
                            {loading ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                            {loading ? 'Finalizing Registry...' : 'Commit Matrix Registry'}
                        </button>
                    </div>
                </form>
            </DialogContent>

            {/* Sub-dialogs for quick creation */}
            <InnerQuickDialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                title="Define Category"
                value={newCategoryName}
                onChange={setNewCategoryName}
                onAdd={async () => {
                    const res = await createCategory(newCategoryName, selectedBusinessId);
                    if (res.success) {
                        setLocalCategories([...localCategories, res.category]);
                        setNewCategoryName('');
                        setIsCategoryDialogOpen(false);
                        toast.success('Category created');
                        // Manually trigger a check/refresh if parent exposed something
                    }
                }}
            />

            <InnerQuickDialog
                open={isUnitDialogOpen}
                onOpenChange={setIsUnitDialogOpen}
                title="Define Size / Unit"
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
        </Dialog>
    );
}

function InnerQuickDialog({ open, onOpenChange, title, value, onChange, onAdd }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-white p-6 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black uppercase italic">{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <input
                        autoFocus
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                        placeholder="Identifier Name..."
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onAdd}
                            disabled={!value.trim()}
                            className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
