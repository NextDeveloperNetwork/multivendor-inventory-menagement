'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createTransfer, updateTransfer } from '@/app/actions/transfer';
import { Plus, Trash2, TruckIcon, Package, ArrowRight, AlertTriangle, Warehouse, Store, MapPin, Calendar, Search, Eye, Edit2, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import TransferDetailsDialog from './TransferDetailsDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import DeleteTransferButton from './DeleteTransferButton';

interface TransferClientProps {
    transfers: any[];
    products: any[];
    shops: any[];
    warehouses: any[];
    inventory: any[];
    selectedBusinessId: string | null;
}

export default function TransferClient({ transfers, products, shops, warehouses, inventory, selectedBusinessId }: TransferClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showForm, setShowForm] = useState(false);
    const [editingTransferId, setEditingTransferId] = useState<string | null>(null);

    // Origin
    const [fromType, setFromType] = useState<'warehouse' | 'shop'>('warehouse');
    const [fromId, setFromId] = useState('');

    // Destination
    const [toType, setToType] = useState<'warehouse' | 'shop'>('shop');
    const [toId, setToId] = useState('');

    const [items, setItems] = useState<Array<{ productId: string; productName: string; quantity: string }>>([
        { productId: '', productName: '', quantity: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [showAllProducts, setShowAllProducts] = useState(true);

    // Sync filters from URL
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const updateFilters = (field: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(field, value);
        else params.delete(field);
        router.push(`/admin/transfers?${params.toString()}`);
    };

    const addItem = () => {
        setItems([...items, { productId: '', productName: '', quantity: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value } as any;
        setItems(newItems);
    };

    const handleProductNameChange = (index: number, val: string) => {
        const matched = products.find(p => p.name.toLowerCase() === val.toLowerCase());
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productName: val,
            productId: matched ? matched.id : '',
        };
        setItems(newItems);
    };

    const getAvailableQuantity = (productId: string) => {
        if (!fromId) return 0;
        const inv = inventory.find(inv =>
            inv.productId === productId &&
            (fromType === 'warehouse' ? inv.warehouseId === fromId : inv.shopId === fromId)
        );
        let baseQty = inv?.quantity || 0;

        // If we are editing, add back the quantity currently in the transfer manifest
        if (editingTransferId) {
            const originalTransfer = transfers.find(t => t.id === editingTransferId);
            const originalSourceId = originalTransfer?.fromWarehouseId || originalTransfer?.fromShopId;
            if (originalSourceId === fromId) {
                const originalItem = originalTransfer?.items.find((i: any) => i.productId === productId);
                if (originalItem) baseQty += originalItem.quantity;
            }
        }

        return baseQty;
    };

    const handleEdit = (transfer: any) => {
        setEditingTransferId(transfer.id);
        setFromType(transfer.fromWarehouseId ? 'warehouse' : 'shop');
        setFromId(transfer.fromWarehouseId || transfer.fromShopId);
        setToType(transfer.toWarehouseId ? 'warehouse' : 'shop');
        setToId(transfer.toWarehouseId || transfer.toShopId);
        setItems(transfer.items.map((i: any) => ({ 
            productId: i.productId, 
            productName: i.product?.name || '',
            quantity: i.quantity.toString() 
        })));
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingTransferId(null);
        setFromType('warehouse');
        setFromId('');
        setToType('shop');
        setToId('');
        setItems([{ productId: '', productName: '', quantity: '' }]);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (fromType === toType && fromId === toId) {
            toast.error("Source and destination cannot be the same.");
            return;
        }

        for (const item of items) {
            if (item.productId && item.quantity) {
                const available = getAvailableQuantity(item.productId);
                const requested = parseInt(item.quantity);
                if (requested > available) {
                    toast.error(`Insufficient quantity for product in selected source. Available: ${available}`);
                    return;
                }
            }
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('fromType', fromType);
        formData.append('fromId', fromId);
        formData.append('toType', toType);
        formData.append('toId', toId);
        if (selectedBusinessId) {
            formData.append('businessId', selectedBusinessId);
        }
        formData.append('items', JSON.stringify(items.filter(item => item.productId && item.quantity)));

        let result;
        if (editingTransferId) {
            result = await updateTransfer(editingTransferId, formData);
        } else {
            result = await createTransfer(formData);
        }

        if (result.success) {
            toast.success(editingTransferId ? 'Transfer updated' : 'Transfer initiated');
            resetForm();
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50">
            <datalist id="transfer-products">
                {products
                    .filter(p => showAllProducts || !fromId || getAvailableQuantity(p.id) > 0)
                    .map(p => (
                        <option key={p.id} value={p.name} />
                    ))}
            </datalist>

            {/* ── Top Toolbar ── */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-white border-b border-slate-300">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
                        <TruckIcon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none uppercase">Stock <span className="text-indigo-600">Transfers</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Internal stock movement registry</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-slate-900/10"
                    >
                        <Plus size={18} strokeWidth={3} />
                        New Transfer Record
                    </button>

                    <div className="h-4 w-[1px] bg-slate-300 mx-2 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-12 shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        <div className="flex items-center gap-2">
                            <input
                                type="date" value={startDate}
                                onChange={e => updateFilters('startDate', e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-900 outline-none w-[110px]"
                            />
                            <span className="text-slate-300 text-[10px] font-bold tracking-widest">—</span>
                            <input
                                type="date" value={endDate}
                                onChange={e => updateFilters('endDate', e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-900 outline-none w-[110px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Area ── */}
            <div className="px-6 py-4 flex items-center gap-8 bg-slate-50/50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{transfers.length} Transfers Logged</span>
                </div>
            </div>

            {/* ── Main Table ── */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    {transfers.length === 0 ? (
                        <div className="py-32 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                <TruckIcon className="text-slate-300" size={32} strokeWidth={1} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">No transfers found</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Clear filters or initiate a new stock transfer</p>
                            </div>
                        </div>
                    ) : (
                        <div className="min-w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">Reference</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date & Time</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transfer Route</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Summary</TableHead>
                                        <TableHead className="text-right py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.map((transfer) => {
                                        const sourceName = (transfer.fromWarehouse?.name || transfer.fromShop?.name || 'GENERIC SOURCE').toUpperCase();
                                        const destName = (transfer.toWarehouse?.name || transfer.toShop?.name || 'GENERIC TARGET').toUpperCase();
                                        const totalUnits = transfer.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

                                        return (
                                            <TableRow key={transfer.id} className="group hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0 h-20">
                                                <TableCell className="px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                            <TruckIcon size={16} strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-900 tracking-tight">REF-{transfer.id.slice(-6).toUpperCase()}</div>
                                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Order Ref</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-bold text-slate-600 tabular-nums">
                                                        {formatDateTime(transfer.date)}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Logged Date</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-xs font-bold text-slate-900 tracking-tight">{sourceName}</div>
                                                        <ArrowRight size={14} className="text-slate-300" />
                                                        <div className="text-xs font-bold text-slate-900 tracking-tight">{destName}</div>
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stock Route</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                                        <Package size={12} className="text-slate-400" />
                                                        <span className="text-xs font-black text-slate-900 tracking-tighter tabular-nums">{totalUnits} UNITS</span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">{transfer.items.length} LINE ITEMS</div>
                                                </TableCell>
                                                <TableCell className="px-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <TransferDetailsDialog transfer={transfer}>
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 cursor-pointer">
                                                                <Eye size={18} strokeWidth={1.5} />
                                                            </div>
                                                        </TransferDetailsDialog>
                                                        <div
                                                            onClick={() => handleEdit(transfer)}
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                                                        >
                                                            <Edit2 size={16} strokeWidth={1.5} />
                                                        </div>
                                                        <DeleteTransferButton id={transfer.id} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create/Edit Transfer Dialog ── */}
            <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-[1200px] w-[98vw] p-0 gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl max-h-[95vh] flex flex-col bg-white">
                    <DialogHeader className="bg-white px-10 py-8 flex-row items-center justify-between space-y-0 shrink-0 border-b border-slate-100">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <TruckIcon size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 font-bold text-3xl tracking-tight leading-none uppercase">
                                    {editingTransferId ? 'Update Record' : 'Internal Transfer'}
                                </DialogTitle>
                                <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest font-bold">Internal stock movement registry</p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200 shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
                        <div className="bg-slate-50/50 border-b border-slate-200 px-10 py-8 grid grid-cols-1 md:grid-cols-2 gap-10 shrink-0">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                    01. Origin Point
                                </label>
                                <div className="flex bg-slate-200 p-0.5 rounded-xl">
                                    {(['warehouse', 'shop'] as const).map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => { setFromType(t); setFromId(''); }}
                                            className={`flex-1 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${fromType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {t === 'warehouse' ? 'Warehouse' : 'Retail Shop'}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer uppercase" required>
                                        <option value="">Identify source…</option>
                                        {(fromType === 'warehouse' ? warehouses : shops).map(item => (
                                            <option key={item.id} value={item.id}>{item.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <MapPin size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2 italic">
                                    02. Target Destination
                                </label>
                                <div className="flex bg-slate-200 p-0.5 rounded-xl">
                                    {(['warehouse', 'shop'] as const).map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => { setToType(t); setToId(''); }}
                                            className={`flex-1 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${toType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {t === 'warehouse' ? 'Warehouse' : 'Retail Shop'}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer uppercase" required>
                                        <option value="">Identify destination…</option>
                                        {(toType === 'warehouse' ? warehouses : shops).map(item => (
                                            <option key={item.id} value={item.id}>{item.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <MapPin size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-10 py-10 bg-white">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Stock Manifest</h3>
                                    <div className="flex items-center gap-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry of products to be moved</p>
                                        {fromId && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllProducts(!showAllProducts)}
                                                className={`text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${showAllProducts ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-900'}`}
                                            >
                                                {showAllProducts ? 'Complete Catalog' : 'Local Stock Only'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button type="button" onClick={addItem} className="group flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white active:scale-95 shadow-sm">
                                    <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Add Item
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {items.map((item, index) => {
                                    const available = getAvailableQuantity(item.productId);
                                    const requested = parseInt(item.quantity) || 0;
                                    const isInsufficient = requested > available;

                                    return (
                                        <div key={index} className={`flex flex-col md:flex-row gap-6 p-6 border-2 rounded-2xl items-center transition-all ${isInsufficient ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-50/30 border-slate-100 hover:border-slate-200'}`}>
                                            <div className="flex-1 space-y-2 w-full">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Product Description / SKU</label>
                                                <input
                                                    type="text"
                                                    list="transfer-products"
                                                    value={item.productName}
                                                    onChange={e => handleProductNameChange(index, e.target.value)}
                                                    placeholder="Search for product…"
                                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all uppercase placeholder:text-slate-300"
                                                    required
                                                />
                                                {item.productId && (
                                                    <div className={`text-[9px] mt-2 font-bold px-1 uppercase tracking-widest font-mono ${isInsufficient ? 'text-rose-600' : 'text-slate-400'}`}>
                                                        {isInsufficient ? 'Alert:' : 'Registry:'} Available Balance {available} units
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full md:w-48 space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Total Units</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    className={`w-full h-12 px-4 bg-white border rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 transition-all text-center tabular-nums font-mono ${isInsufficient ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/5'}`}
                                                    placeholder="0"
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                            <div className="flex h-12 items-end pb-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-100 hover:border-slate-900 rounded-xl transition-all bg-white"
                                                    disabled={items.length === 1}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="shrink-0 px-10 py-8 border-t border-slate-200 flex items-center justify-between bg-white">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-3 rounded-2xl border-2 border-slate-100 text-[11px] font-bold text-slate-400 hover:text-slate-900 hover:border-slate-900 uppercase tracking-widest transition-all active:scale-95"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-14 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-4 shadow-xl shadow-slate-900/10"
                            >
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3" /> Syncing…</>
                                ) : (
                                    <><TruckIcon size={18} className="mr-3" /> {editingTransferId ? 'Update Transfer' : 'Complete Transfer'}</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
