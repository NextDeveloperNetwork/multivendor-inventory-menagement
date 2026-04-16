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

    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [localCategories, setLocalCategories] = useState<any[]>(initialCategories);
    const [localUnits, setLocalUnits] = useState<any[]>(initialUnits);

    useEffect(() => { setLocalCategories(initialCategories); }, [initialCategories]);
    useEffect(() => { setLocalUnits(initialUnits); }, [initialUnits]);

    const addRow = () => setRows([...rows, { name: '', sku: '', price: '', cost: '', initialStock: '0', categoryId: '', unitId: '', isPriceManual: false }]);
    const removeRow = (index: number) => { if (rows.length > 1) setRows(rows.filter((_, i) => i !== index)); };

    const updateRow = (index: number, field: keyof ProductRow, value: any) => {
        const newRows = [...rows];
        const row = { ...newRows[index], [field]: value };
        if (field === 'price') row.isPriceManual = true;
        if (field === 'cost' && !row.isPriceManual && value) row.price = (Number(value) * 1.4).toFixed(2);
        newRows[index] = row;
        setRows(newRows);
    };

    const handleGenerateSKU = (index: number) => {
        const product = rows[index];
        if (!product.name) { toast.error("ENTER NAME FIRST"); return; }
        updateRow(index, 'sku', generateSKU(product.name));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validRows = rows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) { toast.error("ADD AT LEAST ONE PRODUCT"); return; }

        setLoading(true);
        const res = await manualBulkCreateProducts(validRows, {
            businessId: selectedBusinessId,
            targetType: 'warehouse',
            targetId: undefined
        });

        if (res.success) {
            toast.success(`CATALOG SYNCHRONIZED: ${res.count} ITEMS`, {
                className: 'bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-widest font-black text-[9px]'
            });
            setOpen(false);
            setRows([{ name: '', sku: '', price: '', cost: '', initialStock: '0', categoryId: '', unitId: '', isPriceManual: false }]);
            if (onSuccess) onSuccess(res.count || 0);
        } else {
            toast.error(res.error || "SYNC FAILED");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 border border-indigo-100"
                >
                    <Plus size={12} strokeWidth={4} /> Batch Article Entry
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-[1400px] w-full h-full sm:h-[94vh] p-0 flex flex-col bg-slate-50 overflow-hidden rounded-none sm:rounded-[2.5rem] border-none shadow-2xl">
                {/* Lean Header */}
                <DialogHeader className="px-6 py-4 border-b border-slate-200/60 bg-white flex flex-row items-center justify-between shrink-0 space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-2 ring-white">
                            <Activity size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic">
                                BATCH CATALOG REGISTRY
                            </DialogTitle>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">High Impact Rapid Article Indexing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsCategoryDialogOpen(true)}
                            className="h-8 px-3 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus size={10} strokeWidth={4} /> CATEGORY
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsUnitDialogOpen(true)}
                            className="h-8 px-3 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus size={10} strokeWidth={4} /> UNIT / SIZE
                        </button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto px-6 py-6 custom-scrollbar">
                        {/* Dense Grid Header */}
                        <div className="hidden lg:grid grid-cols-[40px_1fr_1fr_120px_120px_90px_90px_50px] gap-3 text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-3 px-3">
                            <div className="text-center">#</div>
                            <div>ARTICLE NAME INDENTIFIER</div>
                            <div>SYSTEM SKU REPRESENTATION</div>
                            <div>CATALOG CATEGORY</div>
                            <div>UNIT DYNAMICS</div>
                            <div className="text-right">UNIT COST</div>
                            <div className="text-right">MARKET PRICE</div>
                            <div className="text-center">OPS</div>
                        </div>

                        <div className="space-y-2">
                            {rows.map((row, index) => (
                                <div key={index} className="flex flex-col lg:grid lg:grid-cols-[40px_1fr_1fr_120px_120px_90px_90px_50px] lg:gap-3 lg:items-center bg-white p-4 lg:p-1.5 rounded-[1.25rem] lg:rounded-xl border border-slate-200 hover:border-indigo-300 transition-all relative group shadow-sm">
                                    <div className="lg:block text-center text-[10px] font-black text-slate-300 italic group-hover:text-indigo-600 transition-colors">{index + 1}</div>
                                    
                                    <div className="space-y-1 mb-3 lg:mb-0">
                                        <label className="lg:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Article Name</label>
                                        <input
                                            value={row.name}
                                            onChange={(e) => updateRow(index, 'name', e.target.value)}
                                            required
                                            className="w-full h-8 px-3 bg-slate-50 lg:bg-transparent border border-slate-100 lg:border-none rounded-lg text-xs font-bold text-slate-900 focus:bg-white lg:focus:bg-slate-50 outline-none transition-all uppercase placeholder:text-slate-300"
                                            placeholder="Enter article name..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 lg:contents gap-2 mb-3 lg:mb-0">
                                        <div className="space-y-1">
                                            <label className="lg:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Reference SKU</label>
                                            <div className="relative">
                                                <input
                                                    value={row.sku}
                                                    onChange={(e) => updateRow(index, 'sku', e.target.value)}
                                                    className="w-full h-8 pl-3 pr-8 bg-slate-50 lg:bg-transparent border border-slate-100 lg:border-none rounded-lg text-[10px] sm:text-[9px] font-mono font-bold text-slate-900 outline-none transition-all uppercase placeholder:text-slate-300"
                                                    placeholder="AUTO-GEN SKU..."
                                                />
                                                <button type="button" onClick={() => handleGenerateSKU(index)} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-colors">
                                                    <RefreshCw size={10} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="lg:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Category</label>
                                            <select
                                                value={row.categoryId}
                                                onChange={(e) => updateRow(index, 'categoryId', e.target.value)}
                                                className="w-full h-8 px-2 bg-slate-50 lg:bg-transparent border border-slate-100 lg:border-none rounded-lg text-[9px] font-black text-slate-900 outline-none uppercase italic appearance-none cursor-pointer"
                                            >
                                                <option value="">SELECT CLASS...</option>
                                                {localCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 lg:contents gap-2">
                                        <div className="space-y-1">
                                            <label className="lg:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Unit</label>
                                            <select
                                                value={row.unitId}
                                                onChange={(e) => updateRow(index, 'unitId', e.target.value)}
                                                className="w-full h-8 px-2 bg-slate-50 lg:bg-transparent border border-slate-100 lg:border-none rounded-lg text-[9px] font-black text-slate-900 outline-none uppercase italic appearance-none cursor-pointer"
                                            >
                                                <option value="">UNIT...</option>
                                                {localUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="lg:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest text-right mr-0.5">Cost</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.cost}
                                                onChange={(e) => updateRow(index, 'cost', e.target.value)}
                                                className="w-full h-8 px-2 bg-slate-50 lg:bg-transparent border border-slate-100 lg:border-none rounded-lg text-[10px] font-mono text-right font-black text-slate-900 outline-none transition-all placeholder:text-slate-300 italic"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="lg:hidden text-[7px] font-black text-slate-400 uppercase tracking-widest text-right mr-0.5">Price</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.price}
                                                onChange={(e) => updateRow(index, 'price', e.target.value)}
                                                className="w-full h-8 px-2 bg-slate-50 lg:bg-transparent border border-slate-100 lg:border-none rounded-lg text-[10px] font-mono text-right font-black text-indigo-600 outline-none transition-all placeholder:text-slate-300 italic"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:block text-center mt-3 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-none border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            className="w-full lg:w-8 lg:h-8 flex items-center justify-center gap-2 lg:gap-0 bg-rose-50 lg:bg-transparent text-rose-500 rounded-lg lg:rounded-lg text-[8px] lg:text-[10px] font-black uppercase tracking-widest lg:hover:bg-rose-50 transition-all p-2 lg:p-0"
                                        >
                                            <Trash2 size={12} strokeWidth={3} />
                                            <span className="lg:hidden">REMOVE LINE</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button
                            type="button"
                            onClick={addRow}
                            className="w-full mt-4 h-11 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-black uppercase tracking-[0.2em] text-[8px] hover:border-indigo-600 hover:text-indigo-600 hover:bg-white transition-all active:scale-[0.98] group"
                        >
                            <Plus size={14} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
                            APPEND REGISTRY MATRIX LINE
                        </button>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-200/60 bg-white flex items-center justify-between shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors italic"
                        >
                            [ DISCARD_BUFFER ]
                        </button>
                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">VALIDATED NODES</span>
                                <span className="text-xs font-black text-slate-900 tabular-nums">{rows.filter(r => r.name).length} ENTRIES</span>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                            >
                                {loading ? <Activity size={12} className="animate-spin" /> : <Save size={12} strokeWidth={3} />}
                                {loading ? 'SYNCHRONIZING...' : 'COMMIT CATALOG REGISTRY'}
                            </button>
                        </div>
                    </div>
                </form>
            </DialogContent>

            {/* Sub-dialogs for quick creation */}
            <InnerQuickDialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                title="Define Catalog Class"
                value={newCategoryName}
                onChange={setNewCategoryName}
                onAdd={async () => {
                    const res = await createCategory(newCategoryName, selectedBusinessId);
                    if (res.success) {
                        setLocalCategories([...localCategories, res.category]);
                        setNewCategoryName('');
                        setIsCategoryDialogOpen(false);
                        toast.success('CLASS REGISTERED');
                    }
                }}
            />

            <InnerQuickDialog
                open={isUnitDialogOpen}
                onOpenChange={setIsUnitDialogOpen}
                title="Define Measurement Unit"
                value={newUnitName}
                onChange={setNewUnitName}
                onAdd={async () => {
                    const res = await createUnit(newUnitName, selectedBusinessId);
                    if (res.success) {
                        setLocalUnits([...localUnits, res.unit]);
                        setNewUnitName('');
                        setIsUnitDialogOpen(false);
                        toast.success('UNIT REGISTERED');
                    }
                }}
            />
        </Dialog>
    );
}

function InnerQuickDialog({ open, onOpenChange, title, value, onChange, onAdd }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px] bg-white p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl">
                <div className="px-6 py-4 bg-slate-900 text-white">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic">{title}</DialogTitle>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifier Name</label>
                        <input
                            autoFocus
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                            className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:bg-white focus:border-indigo-600 uppercase transition-all"
                            placeholder="Type name..."
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onAdd}
                            disabled={!value.trim()}
                            className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-30 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            Register
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
