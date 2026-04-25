'use client';

import { useState, useTransition, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Tag, Ruler, Plus, Pencil, Trash2, Check, X, Loader2, Package, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getCategories, createCategory, updateCategory, deleteCategory,
    getUnits, createUnit, updateUnit, deleteUnit,
} from '@/app/actions/catalogMeta';

type Mode = 'categories' | 'units';

interface Item {
    id: string;
    name: string;
    _count: { products: number };
}

interface CatalogMetaDialogProps {
    open: boolean;
    onClose: () => void;
    defaultMode?: Mode;
}

export function CatalogMetaDialog({ open, onClose, defaultMode = 'categories' }: CatalogMetaDialogProps) {
    const [mode, setMode] = useState<Mode>(defaultMode);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [addingName, setAddingName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = mode === 'categories' ? await getCategories() : await getUnits();
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchItems();
    }, [open, mode]);

    useEffect(() => {
        setMode(defaultMode);
    }, [defaultMode]);

    const handleAdd = () => {
        const n = addingName.trim();
        if (!n) return;
        startTransition(async () => {
            const res = mode === 'categories' ? await createCategory(n) : await createUnit(n);
            if (res.success) {
                toast.success(`${mode === 'categories' ? 'Category' : 'Unit'} added`);
                setAddingName('');
                setIsAdding(false);
                fetchItems();
            }
        });
    };

    const handleEdit = (item: Item) => {
        setEditingId(item.id);
        setEditingName(item.name);
    };

    const handleEditSave = (id: string) => {
        const n = editingName.trim();
        if (!n) return;
        startTransition(async () => {
            const res = mode === 'categories' ? await updateCategory(id, n) : await updateUnit(id, n);
            if (res.success) {
                toast.success('Renamed');
                setEditingId(null);
                fetchItems();
            }
        });
    };

    const handleDelete = (id: string, count: number) => {
        if (count > 0) {
            toast.error(`Cannot delete — ${count} product(s) still assigned`);
            return;
        }
        startTransition(async () => {
            const res = mode === 'categories' ? await deleteCategory(id) : await deleteUnit(id);
            if (res.success) {
                toast.success('Deleted');
                fetchItems();
            } else {
                toast.error((res as any).error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-white font-black text-base tracking-tight">
                            Catalog Metadata
                        </DialogTitle>
                        <DialogDescription className="text-indigo-200 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
                            Manage categories &amp; units
                        </DialogDescription>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Mode toggle */}
                <div className="flex bg-slate-50 border-b border-slate-100">
                    {(['categories', 'units'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                                mode === m
                                    ? 'border-indigo-600 text-indigo-600 bg-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {m === 'categories' ? <Tag size={13} /> : <Ruler size={13} />}
                            {m}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-400" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-xs font-semibold">No {mode} yet</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all group"
                            >
                                {/* Color dot */}
                                <div className={`w-2 h-2 rounded-full shrink-0 ${mode === 'categories' ? 'bg-indigo-400' : 'bg-violet-400'}`} />

                                {/* Name / edit input */}
                                {editingId === item.id ? (
                                    <input
                                        autoFocus
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(item.id); if (e.key === 'Escape') setEditingId(null); }}
                                        className="flex-1 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                ) : (
                                    <span className="flex-1 text-xs font-bold text-slate-800 truncate">{item.name}</span>
                                )}

                                {/* Product count badge */}
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black shrink-0 ${
                                    item._count.products > 0
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                                }`}>
                                    <Package size={9} />
                                    {item._count.products}
                                </div>

                                {/* Actions */}
                                {editingId === item.id ? (
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEditSave(item.id)}
                                            disabled={isPending}
                                            className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <Check size={12} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="w-7 h-7 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="w-7 h-7 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <Pencil size={11} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item._count.products)}
                                            disabled={isPending}
                                            className={`w-7 h-7 border rounded-lg flex items-center justify-center transition-colors ${
                                                item._count.products > 0
                                                    ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200'
                                            }`}
                                            title={item._count.products > 0 ? 'Has products — cannot delete' : 'Delete'}
                                        >
                                            {item._count.products > 0 ? <AlertTriangle size={11} /> : <Trash2 size={11} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add row */}
                <div className="px-4 pb-4">
                    {isAdding ? (
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                value={addingName}
                                onChange={(e) => setAddingName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
                                placeholder={`New ${mode === 'categories' ? 'category' : 'unit'} name...`}
                                className="flex-1 h-9 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-slate-300"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={isPending || !addingName.trim()}
                                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Save
                            </button>
                            <button
                                onClick={() => { setIsAdding(false); setAddingName(''); }}
                                className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full h-9 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus size={13} />
                            Add {mode === 'categories' ? 'Category' : 'Unit'}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
