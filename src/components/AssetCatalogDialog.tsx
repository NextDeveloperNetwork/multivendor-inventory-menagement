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
            <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <div className="bg-black p-10 text-white flex justify-between items-end">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                            <Package className="text-blue-500" size={32} /> Asset Catalog
                        </DialogTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Identify and Synchronize Articles into Manifest</p>
                    </DialogHeader>
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            autoFocus
                            placeholder="Filter by Name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-14 pl-12 pr-6 bg-slate-900 border-none rounded-2xl text-sm font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="p-10 bg-slate-50 min-h-[500px]">
                    <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-10">
                        {filtered.length === 0 ? (
                            <div className="col-span-2 flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] gap-6">
                                <div className="p-6 bg-slate-50 rounded-full">
                                    <Package size={48} className="text-slate-200" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">No matching assets found</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registry does not contain this search query</p>
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
                                        className={`group relative p-6 bg-white border-2 rounded-[2rem] cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${isSelected ? 'border-blue-500 shadow-blue-500/10' : 'border-white hover:border-blue-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <Package size={24} />
                                            </div>
                                            {isSelected ? (
                                                <div className="flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                    <CheckCircle2 size={14} /> Added
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                    <Plus size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{product.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">{product.sku}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost: ${parseFloat(product.cost || 0).toFixed(2)}</span>
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
