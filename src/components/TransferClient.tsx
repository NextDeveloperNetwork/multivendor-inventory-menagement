'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createTransfer, updateTransfer } from '@/app/actions/transfer';
import { Plus, Trash2, TruckIcon, Package, ArrowRight, AlertTriangle, Warehouse, Store, MapPin, Calendar, Search, Eye, Edit2 } from 'lucide-react';
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
import DeleteTransferButton from './DeleteTransferButton';

interface TransferClientProps {
    transfers: any[];
    products: any[];
    shops: any[];
    warehouses: any[];
    inventory: any[];
}

export default function TransferClient({ transfers, products, shops, warehouses, inventory }: TransferClientProps) {
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

    const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>([
        { productId: '', quantity: '' },
    ]);
    const [loading, setLoading] = useState(false);

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
        setItems([...items, { productId: '', quantity: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
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
        setItems(transfer.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity.toString() })));
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingTransferId(null);
        setFromType('warehouse');
        setFromId('');
        setToType('shop');
        setToId('');
        setItems([{ productId: '', quantity: '' }]);
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
        <div className="space-y-12 bg-white p-4">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-blue-50 p-8 rounded-[2.5rem] border-2 border-blue-100 shadow-xl shadow-blue-500/5">
                <div className="flex flex-wrap items-center gap-6">
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-black text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-4 text-sm"
                        >
                            <Plus size={20} />
                            Initiate Transfer
                        </button>
                    )}

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border-2 border-blue-100 shadow-sm">
                        <div className="flex items-center gap-4 px-4">
                            <Calendar size={20} className="text-blue-300" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => updateFilters('startDate', e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 text-black uppercase"
                            />
                        </div>
                        <div className="text-blue-100 font-black text-xs">—</div>
                        <div className="flex items-center gap-4 px-4">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => updateFilters('endDate', e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 text-black uppercase"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={24} />
                    <input
                        type="text"
                        placeholder="Search Logistics ID..."
                        className="w-full pl-14 pr-6 h-14 bg-white border-2 border-blue-100 rounded-2xl text-sm font-bold placeholder:text-blue-200 focus:border-blue-400 transition-all outline-none shadow-sm text-black"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                        }}
                    />
                </div>
            </div>

            {showForm && (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-[3rem] shadow-2xl shadow-blue-500/5 p-12 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-12 pb-8 border-b border-blue-100">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                                <TruckIcon size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-black tracking-tighter uppercase italic">{editingTransferId ? 'Edit Logistics Pulse' : 'Logistics Relocation'}</h2>
                                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-2">{editingTransferId ? 'Updating Cross-Node Manifest' : 'Cross-Node Asset Synchronization'}</p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border-2 border-blue-100 text-blue-200 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                        >
                            <Plus size={32} className="rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 relative">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-16 h-16 bg-white border-4 border-blue-50 rounded-full items-center justify-center z-10 shadow-2xl shadow-blue-500/20">
                                <ArrowRight className="text-blue-500" size={28} />
                            </div>

                            <div className="space-y-8">
                                <label className="flex items-center gap-3 text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">
                                    Source Deployment
                                </label>
                                <div className="flex gap-3 p-2 bg-white/50 rounded-2xl border border-blue-100">
                                    <button
                                        type="button"
                                        onClick={() => { setFromType('warehouse'); setFromId(''); }}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${fromType === 'warehouse' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-blue-300 hover:text-blue-500'}`}
                                    >
                                        <Warehouse size={16} /> Warehouse
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setFromType('shop'); setFromId(''); }}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${fromType === 'shop' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-blue-300 hover:text-blue-500'}`}
                                    >
                                        <Store size={16} /> Shop
                                    </button>
                                </div>
                                <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full h-16 px-6 bg-white border-2 border-blue-100 rounded-2xl font-bold text-black focus:border-blue-400 outline-none uppercase text-xs appearance-none" required>
                                    <option value="">Identify Origin...</option>
                                    {(fromType === 'warehouse' ? warehouses : shops).map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-8 text-right md:text-left">
                                <label className="flex items-center gap-3 text-[10px] font-black text-black uppercase tracking-[0.3em] px-2 md:justify-start justify-end">
                                    Target Deployment
                                </label>
                                <div className="flex gap-3 p-2 bg-white/50 rounded-2xl border border-blue-100">
                                    <button
                                        type="button"
                                        onClick={() => { setToType('warehouse'); setToId(''); }}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${toType === 'warehouse' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-blue-300 hover:text-blue-500'}`}
                                    >
                                        <Warehouse size={16} /> Warehouse
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setToType('shop'); setToId(''); }}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${toType === 'shop' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-blue-300 hover:text-blue-500'}`}
                                    >
                                        <Store size={16} /> Shop
                                    </button>
                                </div>
                                <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full h-16 px-6 bg-white border-2 border-blue-100 rounded-2xl font-bold text-black focus:border-blue-400 outline-none uppercase text-xs appearance-none" required>
                                    <option value="">Identify Destination...</option>
                                    {(toType === 'warehouse' ? warehouses : shops).map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="flex justify-between items-center border-b border-blue-100 pb-4">
                                <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest px-2 italic">Manifest Segments</h3>
                                <button type="button" onClick={addItem} className="text-[10px] font-black text-blue-500 bg-white border-2 border-blue-100 px-6 py-2.5 rounded-xl hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all uppercase shadow-sm">
                                    Append Asset +
                                </button>
                            </div>

                            <div className="space-y-6">
                                {items.map((item, index) => {
                                    const available = getAvailableQuantity(item.productId);
                                    const requested = parseInt(item.quantity) || 0;
                                    const isInsufficient = requested > available;

                                    return (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8 bg-white border border-blue-50 rounded-[2rem] items-end shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                            <div className="md:col-span-8 space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest px-2">Asset Identifier / Component</label>
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                    className="w-full h-14 px-6 bg-blue-50/30 border-2 border-blue-50 rounded-xl text-xs font-bold text-black outline-none focus:border-blue-400 transition-all uppercase"
                                                    required
                                                >
                                                    <option value="">Select Resource...</option>
                                                    {products
                                                        .filter(p => getAvailableQuantity(p.id) > 0 || p.id === item.productId)
                                                        .map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} [{p.sku}]</option>
                                                        ))}
                                                </select>
                                                {item.productId && (
                                                    <div className={`text-[10px] mt-3 font-bold px-2 uppercase tracking-widest ${isInsufficient ? 'text-red-500' : 'text-blue-300'}`}>
                                                        Current Node Liquidity: <span className="text-black font-black">{available} units</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="md:col-span-3 space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest px-2">Qty</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        className={`w-full h-14 px-6 bg-blue-50/30 border-2 border-blue-50 rounded-xl text-xs font-black text-black outline-none focus:border-blue-400 text-center transition-all uppercase ${isInsufficient ? 'border-red-400 text-red-500 bg-red-50' : ''}`}
                                                        placeholder="0"
                                                        min="1"
                                                        required
                                                    />
                                                    {isInsufficient && <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />}
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 flex justify-center pb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="w-12 h-12 flex items-center justify-center text-blue-200 hover:text-red-500 bg-blue-50/30 hover:bg-red-50 rounded-xl transition-all"
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-24 bg-black text-white rounded-[2.5rem] font-bold shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] uppercase tracking-[0.4em] text-sm disabled:opacity-30 border-2 border-black"
                        >
                            {loading ? "Synchronizing Asset Manifest..." : editingTransferId ? "Commit Updated Manifest" : "Authorize Global Resynchronization"}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/5">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center px-12">
                    <h3 className="text-2xl font-black flex items-center gap-5 text-slate-900 uppercase tracking-tighter italic">
                        <TruckIcon className="text-blue-600" size={28} />
                        Historical Registry
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100 italic shadow-sm">
                        Audit Stream // 02
                    </span>
                </div>

                {transfers.length === 0 ? (
                    <div className="p-40 text-center">
                        <div className="w-28 h-28 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-full flex items-center justify-center mx-auto mb-10">
                            <TruckIcon className="text-blue-100" size={56} />
                        </div>
                        <p className="text-2xl font-black text-black mb-4 uppercase tracking-tighter italic">Logistics Stream Inactive</p>
                        <p className="text-blue-200 font-bold max-w-sm mx-auto text-xs uppercase tracking-widest leading-relaxed opacity-80">No active system movements detected in current telemetry window.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="py-6 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Logistics ID</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Origin Node</TableHead>
                                        <TableHead className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Vector</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Node</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Manifest</TableHead>
                                        <TableHead className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Date Stamp</TableHead>
                                        <TableHead className="py-6 px-12 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.map((transfer) => {
                                        const sourceName = transfer.fromWarehouse?.name || transfer.fromShop?.name || 'Unset Node';
                                        const destName = transfer.toWarehouse?.name || transfer.toShop?.name || 'Unset Node';
                                        const totalUnits = transfer.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

                                        return (
                                            <TransferDetailsDialog key={transfer.id} transfer={transfer}>
                                                <TableRow className="group cursor-pointer hover:bg-blue-50/50 transition-all border-b border-slate-50 last:border-0 h-24">
                                                    <TableCell className="px-12 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                                <TruckIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-900 tracking-tight text-lg underline decoration-blue-500/10 underline-offset-4 group-hover:decoration-blue-500/30">
                                                                    #{transfer.id.slice(-6).toUpperCase()}
                                                                </div>
                                                                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1 opacity-60 font-mono">CODE//LOGS</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-600 bg-white shadow-sm group-hover:border-blue-400 transition-all">
                                                                {transfer.fromWarehouseId ? <Warehouse size={18} /> : <Store size={18} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-900 font-bold text-sm uppercase tracking-tight">{sourceName}</span>
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Departure</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                                                            <ArrowRight size={20} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-600 bg-white shadow-sm group-hover:border-blue-400 transition-all">
                                                                {transfer.toWarehouseId ? <Warehouse size={18} /> : <Store size={18} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-900 font-bold text-sm uppercase tracking-tight">{destName}</span>
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Arrival</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                                <Package size={12} className="text-blue-500" />
                                                                {transfer.items.length} Segments
                                                            </span>
                                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">{totalUnits} Units Payload</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <div className="text-[11px] font-black text-slate-900 tracking-tighter font-mono italic">{formatDateTime(transfer.date)}</div>
                                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Synchronized</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-12 text-right">
                                                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer" title="View Details">
                                                                <Eye size={20} />
                                                            </div>
                                                            <div
                                                                onClick={() => handleEdit(transfer)}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                                                                title="Modify Entry"
                                                            >
                                                                <Edit2 size={18} />
                                                            </div>
                                                            <DeleteTransferButton id={transfer.id} />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TransferDetailsDialog>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                            {transfers.map((transfer) => {
                                const sourceName = transfer.fromWarehouse?.name || transfer.fromShop?.name || 'Unset Node';
                                const destName = transfer.toWarehouse?.name || transfer.toShop?.name || 'Unset Node';
                                const totalUnits = transfer.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

                                return (
                                    <TransferDetailsDialog key={transfer.id} transfer={transfer}>
                                        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm space-y-4 hover:border-blue-200 transition-all active:scale-[0.98]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                                                        <TruckIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-lg">#{transfer.id.slice(-6).toUpperCase()}</div>
                                                        <div className="text-[10px] text-blue-400 font-bold font-mono uppercase tracking-widest">CODE//LOGS</div>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">Synchronized</div>
                                            </div>

                                            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">From</div>
                                                    <div className="text-xs font-black text-slate-700 truncate">{sourceName}</div>
                                                </div>
                                                <ArrowRight size={16} className="text-slate-300" />
                                                <div className="text-right">
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">To</div>
                                                    <div className="text-xs font-black text-slate-700 truncate">{destName}</div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Package size={14} className="text-blue-500" />
                                                    {totalUnits} Units
                                                </div>
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <div onClick={() => handleEdit(transfer)} className="p-2 text-slate-300 hover:text-blue-500">
                                                        <Edit2 size={18} />
                                                    </div>
                                                    <DeleteTransferButton id={transfer.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </TransferDetailsDialog>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
