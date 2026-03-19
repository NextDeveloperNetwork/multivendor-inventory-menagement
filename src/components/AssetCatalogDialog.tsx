'use client';

import { useState } from 'react';
import { Search, Package, Plus, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QuickAddProductDialog from './QuickAddProductDialog';

interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    cost?: any;
    price?: any;
}

interface AssetCatalogDialogProps {
    products: Product[];
    onSelect: (product: Product) => void;
    selectedIds: string[];
}

export default function AssetCatalogDialog({ products, onSelect, selectedIds }: AssetCatalogDialogProps) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95">
                    <Package size={20} /> Open Asset Catalog
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                {/* Header & Search Section */}
                <div className="bg-white px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                            <Package size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogHeader>
                                <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none uppercase italic">
                                    Asset Repository
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black italic">Synchronize Articles into Manifest</span>
                                </div>
                            </DialogHeader>
                        </div>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2.5} />
                        <input
                            autoFocus
                            placeholder="Search by Title or UID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm placeholder:text-slate-300 placeholder:italic uppercase"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-10 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        {filtered.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white border-2 border-dashed border-slate-100 rounded-3xl gap-8 shadow-sm">
                                <div className="p-8 bg-slate-50 rounded-full border border-slate-100 text-slate-200">
                                    <Package size={48} strokeWidth={1} />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-serif text-slate-900 italic tracking-tight uppercase">Null Search Returns</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Registry does not contain this search query</p>
                                </div>
                                <QuickAddProductDialog onAdd={(p) => {
                                    onSelect(p);
                                    setOpen(false);
                                }} />
                            </div>
                        ) : (
                            filtered.map(product => {
                                const isSelected = selectedIds.includes(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => onSelect(product)}
                                        className={`group relative p-6 bg-white border border-slate-100 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${isSelected ? 'ring-2 ring-slate-900 shadow-xl shadow-slate-900/5' : 'hover:border-slate-300 shadow-sm'}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                <Package size={20} strokeWidth={1.5} />
                                            </div>
                                            {isSelected ? (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest italic">
                                                    <CheckCircle2 size={14} strokeWidth={2.5} className="text-emerald-500" /> Linked
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                                                    <Plus size={18} strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-serif text-xl text-slate-900 italic tracking-tight group-hover:text-slate-700 transition-colors uppercase truncate">{product.name}</h4>
                                            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Global_UID</span>
                                                    <span className="text-[10px] font-black text-slate-900 font-mono tracking-tighter uppercase leading-none">{product.sku}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Net_Valuation</span>
                                                    <span className="text-[11px] font-black text-slate-900 tabular-nums leading-none">${parseFloat(product.cost || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
