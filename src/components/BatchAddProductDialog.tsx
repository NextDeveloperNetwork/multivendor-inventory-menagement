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
        const validRows = rows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) {
            toast.error("Add at least one product with a name");
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

            <DialogContent className="max-w-[1400px] w-full h-full sm:h-[90vh] p-0 flex flex-col bg-white overflow-hidden rounded-none sm:rounded-2xl border-none sm:border border-slate-200 shadow-2xl">
                <DialogHeader className="px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0 bg-slate-900 sm:bg-white text-white sm:text-slate-900 shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 sm:bg-slate-50 border border-blue-500 sm:border-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center text-white sm:text-slate-900">
                            <Package size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-black italic uppercase tracking-tight">Batch Entry</DialogTitle>
                            <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none sm:leading-normal">Rapid Digital Cataloging</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                        <button
                            type="button"
                            onClick={() => setIsCategoryDialogOpen(true)}
                            className="h-8 sm:h-9 px-3 sm:px-4 bg-slate-800 sm:bg-white border border-slate-700 sm:border-slate-200 rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-white sm:text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus size={10} strokeWidth={3} /> Category
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsUnitDialogOpen(true)}
                            className="h-8 sm:h-9 px-3 sm:px-4 bg-slate-800 sm:bg-white border border-slate-700 sm:border-slate-200 rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-white sm:text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus size={10} strokeWidth={3} /> Unit
                        </button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto px-5 sm:px-8 py-6">
                        {/* Desktop Header */}
                        <div className="hidden sm:grid grid-cols-[30px_1.5fr_1fr_1fr_1fr_80px_80px_50px] gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-4 px-2">
                            <div>#</div>
                            <div>Product Name</div>
                            <div>SKU</div>
                            <div>Category</div>
                            <div>Unit</div>
                            <div className="text-right">Cost</div>
                            <div className="text-right">Price</div>
                            <div className="text-center">Del</div>
                        </div>

                        <div className="space-y-6 sm:space-y-2">
                            {rows.map((row, index) => (
                                <div key={index} className="flex flex-col sm:grid sm:grid-cols-[30px_1.5fr_1fr_1fr_1fr_80px_80px_50px] sm:gap-4 sm:items-center bg-slate-50/50 sm:bg-transparent p-4 sm:p-2 rounded-2xl sm:rounded-none border sm:border-none border-slate-100 hover:bg-white transition-colors relative">
                                    <div className="sm:hidden absolute -top-3 left-4 bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-black italic tabular-nums">ENTRY_{index + 1}</div>
                                    <div className="hidden sm:block text-[10px] font-black text-slate-300 italic">{index + 1}</div>
                                    
                                    <div className="space-y-1 mb-3 sm:mb-0">
                                        <label className="sm:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest">Article Name</label>
                                        <input
                                            value={row.name}
                                            onChange={(e) => updateRow(index, 'name', e.target.value)}
                                            required
                                            className="w-full h-9 px-3 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-lg text-xs font-bold text-slate-900 focus:border-slate-900 outline-none transition-all uppercase placeholder:text-slate-300"
                                            placeholder="Item name..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:contents gap-3 mb-3 sm:mb-0">
                                        <div className="space-y-1 sm:space-y-0">
                                            <label className="sm:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest">Serial SKU</label>
                                            <div className="relative">
                                                <input
                                                    value={row.sku}
                                                    onChange={(e) => updateRow(index, 'sku', e.target.value)}
                                                    className="w-full h-9 pl-3 pr-8 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-lg text-[10px] sm:text-[9px] font-mono font-bold text-slate-900 focus:border-slate-900 outline-none transition-all uppercase placeholder:text-slate-300"
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
                                        </div>

                                        <div className="space-y-1 sm:space-y-0 text-right sm:text-left">
                                            <label className="sm:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                            <select
                                                value={row.categoryId}
                                                onChange={(e) => updateRow(index, 'categoryId', e.target.value)}
                                                className="w-full h-9 px-2 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-lg text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 uppercase italic appearance-none"
                                            >
                                                <option value="">CLASS...</option>
                                                {localCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 sm:contents gap-3">
                                        <div className="space-y-1 sm:space-y-0 col-span-1">
                                            <label className="sm:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                                            <select
                                                value={row.unitId}
                                                onChange={(e) => updateRow(index, 'unitId', e.target.value)}
                                                className="w-full h-9 px-2 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-lg text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 uppercase italic appearance-none"
                                            >
                                                <option value="">SIZE...</option>
                                                {localUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1 sm:space-y-0 col-span-1">
                                            <label className="sm:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest text-right">Cost</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.cost}
                                                onChange={(e) => updateRow(index, 'cost', e.target.value)}
                                                className="w-full h-9 px-2 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-lg text-[12px] sm:text-[10px] font-mono text-right font-black text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:space-y-0 col-span-1">
                                            <label className="sm:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest text-right">Price</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.price}
                                                onChange={(e) => updateRow(index, 'price', e.target.value)}
                                                className="w-full h-9 px-2 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-lg text-[12px] sm:text-[10px] font-mono text-right font-black text-blue-600 outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:hidden mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest"
                                        >
                                            <Trash2 size={12} /> Remove Line
                                        </button>
                                    </div>
                                    <div className="hidden sm:block px-2 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addRow}
                            className="w-full mt-6 h-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:border-slate-900 hover:text-slate-900 transition-all active:scale-95 group shadow-sm"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            Add Registry Line
                        </button>
                    </div>

                    <div className="px-5 sm:px-8 py-4 sm:py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                        >
                            Discard_Changes
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto h-12 px-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                        >
                            {loading ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                            {loading ? 'Finalizing...' : 'Commit Matrix Registry'}
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
