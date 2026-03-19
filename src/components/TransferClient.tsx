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
    DialogTrigger,
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            {/* datalist for product search */}
            <datalist id="transfer-products">
                {products
                    .filter(p => showAllProducts || !fromId || getAvailableQuantity(p.id) > 0)
                    .map(p => (
                        <option key={p.id} value={p.name} />
                    ))}
            </datalist>

            {/* ── Top Toolbar ── */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-white border-b border-slate-300">
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-blue-500/10"
                    >
                        <Plus size={16} strokeWidth={3} />
                        New Transfer
                    </button>

                    <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 h-10">
                        <Calendar size={14} className="text-slate-500" />
                        <div className="flex items-center gap-1">
                            <input
                                type="date" value={startDate}
                                onChange={e => updateFilters('startDate', e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none w-[105px]"
                            />
                            <span className="text-slate-400 text-[10px] font-bold">TO</span>
                            <input
                                type="date" value={endDate}
                                onChange={e => updateFilters('endDate', e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none w-[105px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative group w-full lg:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search transfers..."
                        className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-900"
                        onKeyDown={e => {
                            if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                        }}
                    />
                </div>
            </div>

            {/* ── Stats Mini-Bar ── */}
            <div className="bg-slate-50/80 border-b border-slate-200 flex items-center gap-6 px-6 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{transfers.length} Movements Recorded</span>
                </div>
            </div>

            {/* ── Main Table Content ── */}
            <div className="flex-1 overflow-auto bg-white">

            {/* ── Create/Edit Transfer Dialog ── */}
            <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 rounded-3xl overflow-hidden border-none shadow-2xl max-h-[92vh] flex flex-col">
                    <DialogHeader className="bg-slate-900 px-8 py-6 flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                <TruckIcon size={20} />
                            </div>
                            <div>
                                <DialogTitle className="text-white font-bold text-lg tracking-tight">
                                    {editingTransferId ? 'Modify Movement Manifest' : 'New Stock Transfer'}
                                </DialogTitle>
                                <p className="text-slate-300 text-xs mt-0.5 uppercase tracking-[0.1em] font-bold italic">
                                    {editingTransferId ? 'Update Existing Resource Logistics' : 'Coordinate Inbound/Outbound Resource Flow'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white hover:bg-rose-600 hover:border-rose-600 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1 bg-white">
                        <div className="bg-slate-100 border-b border-slate-300 px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative shrink-0">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" /> Source Deployment
                                </label>
                                <div className="flex p-1 bg-white border border-slate-300 rounded-xl gap-1">
                                    {(['warehouse', 'shop'] as const).map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => { setFromType(t); setFromId(''); }}
                                            className={`flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic ${fromType === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl font-black text-slate-900 focus:border-blue-600 outline-none uppercase text-xs appearance-none transition-all shadow-sm" required>
                                    <option value="">Identify Origin Deployment...</option>
                                    {(fromType === 'warehouse' ? warehouses : shops).map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" /> Target Endpoint
                                </label>
                                <div className="flex p-1 bg-white border border-slate-300 rounded-xl gap-1">
                                    {(['warehouse', 'shop'] as const).map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => { setToType(t); setToId(''); }}
                                            className={`flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic ${toType === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl font-black text-slate-900 focus:border-blue-600 outline-none uppercase text-xs appearance-none transition-all shadow-sm" required>
                                    <option value="">Identify Target Destination...</option>
                                    {(toType === 'warehouse' ? warehouses : shops).map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] italic">
                                        Movement Manifest — {items.filter(i => i.productId).length} Selected
                                    </span>
                                    {fromId && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllProducts(!showAllProducts)}
                                            className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all italic ${showAllProducts ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-600'}`}
                                        >
                                            {showAllProducts ? 'GLOBAL CATALOG' : 'LOCAL STOCK'}
                                        </button>
                                    )}
                                </div>
                                <button type="button" onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 italic">
                                    <Plus size={14} strokeWidth={3} /> Append Asset
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {items.map((item, index) => {
                                    const available = getAvailableQuantity(item.productId);
                                    const requested = parseInt(item.quantity) || 0;
                                    const isInsufficient = requested > available;

                                    return (
                                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl items-end group transition-all hover:border-slate-400">
                                            <div className="flex-1 space-y-2 w-full">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Resource Identifier / SKU Search</label>
                                                <input
                                                    type="text"
                                                    list="transfer-products"
                                                    value={item.productName}
                                                    onChange={e => handleProductNameChange(index, e.target.value)}
                                                    placeholder="Scan Barcode or Type Product Name…"
                                                    className="w-full h-10 px-4 bg-white border border-slate-300 rounded-xl text-[11px] font-black text-slate-900 outline-none focus:border-blue-600 transition-all uppercase italic shadow-sm"
                                                    required
                                                />
                                                {item.productId && (
                                                    <div className={`text-[8px] mt-1 font-black px-1 uppercase tracking-widest font-mono italic ${isInsufficient ? 'text-rose-600' : 'text-blue-600'}`}>
                                                        Current Node Balance: {available} units
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full md:w-32 space-y-2">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Volume</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        className={`w-full h-10 px-4 bg-white border border-slate-300 rounded-xl text-[11px] font-black text-slate-900 outline-none focus:border-blue-600 text-center transition-all uppercase font-mono shadow-sm ${isInsufficient ? 'border-rose-600 text-rose-600 bg-rose-50' : ''}`}
                                                        placeholder="0"
                                                        min="1"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end pb-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 border border-slate-300 hover:border-rose-600 rounded-xl transition-all bg-white shadow-sm"
                                                    disabled={items.length === 1}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="shrink-0 px-8 py-5 border-t border-slate-200 flex items-center justify-between bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2.5 rounded-xl border border-slate-300 text-[10px] font-black text-slate-600 hover:bg-slate-100 hover:text-slate-900 uppercase tracking-widest transition-all italic"
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-lg shadow-black/10 italic"
                            >
                                {loading ? "SYNCHRONIZING..." : editingTransferId ? "COMMIT_MODIFICATIONS" : "AUTHORIZE_TRANSFER"}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Transfer Records ── */}
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                {transfers.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto">
                            <TruckIcon className="text-slate-300" size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No matching movements found</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 italic">Clear filters or authorize a new transfer</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block min-w-[1000px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-slate-300">
                                        <TableHead className="w-[180px] py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-700">Identity</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Timeline</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Route Origin</TableHead>
                                        <TableHead className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-700">Vector</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Target Endpoint</TableHead>
                                        <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">Payload</TableHead>
                                        <TableHead className="w-[120px] py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-700">Control</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.map((transfer) => {
                                        const sourceName = transfer.fromWarehouse?.name || transfer.fromShop?.name || 'GENERIC SOURCE';
                                        const destName = transfer.toWarehouse?.name || transfer.toShop?.name || 'GENERIC TARGET';
                                        const totalUnits = transfer.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

                                        return (
                                            <TableRow key={transfer.id} className="group hover:bg-blue-50 transition-all border-b border-slate-200 last:border-0 h-16">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                            <TruckIcon size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-xs uppercase tracking-tight">#{transfer.id.slice(-6).toUpperCase()}</div>
                                                            <div className="text-[9px] text-slate-500 font-bold font-mono tracking-tighter uppercase italic">LOG_REF</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-xs">{formatDateTime(transfer.date)}</span>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">RECORDED</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                                                            {transfer.fromWarehouseId ? <Warehouse size={12} /> : <Store size={12} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-900 text-xs uppercase italic">{sourceName}</span>
                                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight line-clamp-1">{transfer.fromWarehouseId ? 'WAREHOUSE_NODE' : 'RETAIL_NODE'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="w-7 h-7 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                                                        <ArrowRight size={12} />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white">
                                                            {transfer.toWarehouseId ? <Warehouse size={12} /> : <Store size={12} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-900 text-xs uppercase italic">{destName}</span>
                                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight line-clamp-1">{transfer.toWarehouseId ? 'WAREHOUSE_NODE' : 'RETAIL_NODE'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200 shadow-sm">
                                                            <Package size={11} className="mr-1.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter">{totalUnits} Units</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">{transfer.items.length} SKUs</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <TransferDetailsDialog transfer={transfer}>
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200 cursor-pointer">
                                                                <Eye size={16} />
                                                            </div>
                                                        </TransferDetailsDialog>
                                                        <div
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(transfer); }}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200 cursor-pointer"
                                                        >
                                                            <Edit2 size={14} />
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

                        {/* Mobile List View */}
                        <div className="grid grid-cols-1 gap-3 md:hidden p-3 bg-slate-100">
                            {transfers.map((transfer) => {
                                const sourceName = transfer.fromWarehouse?.name || transfer.fromShop?.name || 'GENERIC SOURCE';
                                const destName = transfer.toWarehouse?.name || transfer.toShop?.name || 'GENERIC TARGET';
                                const totalUnits = transfer.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                                
                                return (
                                    <div key={transfer.id} className="bg-white p-4 rounded-2xl border border-slate-300 shadow-sm space-y-3 active:scale-[0.98] transition-all group border-l-4 border-l-blue-600">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-blue-600 border border-slate-200">
                                                    <TruckIcon size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-sm tracking-tight uppercase italic">#{transfer.id.slice(-6).toUpperCase()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{formatDateTime(transfer.date)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-black text-blue-600 text-sm italic">
                                                    {totalUnits} Units
                                                </div>
                                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Payload</div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Origin</span>
                                                <span className="text-[10px] font-black text-slate-800 uppercase italic truncate">{sourceName}</span>
                                            </div>
                                            <ArrowRight size={12} className="text-slate-300" />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Target</span>
                                                <span className="text-[10px] font-black text-slate-800 uppercase italic truncate">{destName}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <TransferDetailsDialog transfer={transfer}>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <Eye size={16} />
                                                </div>
                                            </TransferDetailsDialog>
                                            <div
                                                onClick={() => handleEdit(transfer)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100"
                                            >
                                                <Edit2 size={14} />
                                            </div>
                                            <DeleteTransferButton id={transfer.id} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
    );
}

