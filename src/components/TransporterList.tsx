'use client';

import { useState } from 'react';
import {
    Package, DollarSign, RotateCcw, Loader2, Search,
    ShoppingBag, ArrowRight, Truck, CheckCircle, X,
    MapPin, Navigation, AlertCircle, Clock
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { updateTransportStatus } from '@/app/actions/transport-flow';
import { processPartialReturn } from '@/app/actions/returns-flow';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function TransporterList({ transfers }: { transfers: any[] }) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [returns, setReturns] = useState<Record<string, number>>({});
    const router = useRouter();

    const filtered = transfers.filter(t =>
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.fromWarehouse?.name || t.fromShop?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.toWarehouse?.name || t.toShop?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const doAction = async (id: string, type: 'SHIP' | 'DELIVER' | 'PAID') => {
        setLoading(type);
        const res = await updateTransportStatus(id, type);
        if (res.success) { toast.success('Updated'); router.refresh(); }
        else toast.error(res.error || 'Error');
        setLoading(null);
    };

    const statusMap: Record<string, { label: string; className: string; dot?: string }> = {
        PENDING:         { label: 'Pending',        className: 'bg-slate-50 text-slate-500 border-slate-200',         dot: 'bg-slate-400' },
        SHIPPED:         { label: 'In Transit',     className: 'bg-amber-50 text-amber-700 border-amber-200',         dot: 'bg-amber-500 animate-pulse' },
        DELIVERED:       { label: 'Delivered',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-500' },
        PAID:            { label: 'Paid',           className: 'bg-blue-50 text-blue-700 border-blue-200',            dot: 'bg-blue-500' },
        PARTIAL_RETURN:  { label: 'Partial Return', className: 'bg-rose-50 text-rose-700 border-rose-200',            dot: 'bg-rose-500 animate-pulse' },
        RETURN_PENDING:  { label: 'Return Pending', className: 'bg-rose-50 text-rose-700 border-rose-200',            dot: 'bg-rose-500 animate-pulse' },
        RETURN_ACCEPTED: { label: 'Accepted',       className: 'bg-purple-50 text-purple-700 border-purple-200',      dot: 'bg-purple-500' },
        RETURN_REJECTED: { label: 'Rejected',       className: 'bg-slate-50 text-slate-500 border-slate-200',         dot: 'bg-slate-400' },
    };

    const Badge = ({ status }: { status: string }) => {
        const s = statusMap[status] || { label: status, className: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-400' };
        return (
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.className}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Search manifests by ID, origin or destination..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <Truck size={40} strokeWidth={1.2} className="mb-3" />
                        <p className="text-sm font-medium text-slate-400">No manifests found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manifest</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</span>
                        </div>

                        {filtered.map(t => {
                            const from = t.fromWarehouse?.name || t.fromShop?.name || '—';
                            const to   = t.toWarehouse?.name   || t.toShop?.name   || '—';
                            const units = t.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;
                            const sym  = t.toShop?.currency?.symbol || t.fromShop?.currency?.symbol || 'ALL';

                            return (
                                <button
                                    key={t.id}
                                    onClick={() => { setSelected(t); setReturns({}); }}
                                    className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition-all group relative ${t.isReturn ? 'border-l-4 border-l-rose-400' : ''}`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_auto] gap-3 md:gap-4 items-center">
                                        {/* ID */}
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:bg-slate-900 group-hover:text-white ${
                                                t.isReturn ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                t.status === 'SHIPPED' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                t.status === 'PAID' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                'bg-slate-50 text-slate-500 border border-slate-100'
                                            }`}>
                                                {t.isReturn ? <RotateCcw size={15} /> : <Truck size={15} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">#{t.id.slice(-8).toUpperCase()}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{formatDateTime(t.date)}</p>
                                                {t.isReturn && (
                                                    <p className="text-[10px] font-semibold text-rose-500 mt-0.5">
                                                        ↩ Return cf. #{t.parentTransferId?.slice(-6).toUpperCase()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Route */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-slate-700 truncate max-w-[120px]">{from}</span>
                                            <ArrowRight size={13} className="text-slate-300 shrink-0" />
                                            <span className="font-semibold text-slate-700 truncate max-w-[120px]">{to}</span>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2">
                                            <Badge status={t.status} />
                                            <span className="text-xs text-slate-400">{units} units</span>
                                        </div>

                                        {/* Value */}
                                        <div className="text-right">
                                            {t.totalAmount ? (
                                                <span className="text-sm font-bold text-slate-900">
                                                    {sym} {Number(t.totalAmount).toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden outline-none max-h-[90vh] flex flex-col">
                    {selected && (() => {
                        const sym = selected.toShop?.currency?.symbol || selected.fromShop?.currency?.symbol || 'ALL';
                        const total = Number(selected.totalAmount || 0);
                        const retVal = Object.entries(returns).reduce((acc, [itemId, qty]) => {
                            const item = selected.items.find((i: any) => i.id === itemId);
                            return acc + ((qty as number) * Number(item?.product?.price || 0));
                        }, 0);
                        const net = Math.max(0, total - retVal);
                        const hasReturns = Object.values(returns).some(v => v > 0);
                        const from = selected.fromWarehouse?.name || selected.fromShop?.name || '—';
                        const to   = selected.toWarehouse?.name   || selected.toShop?.name   || '—';

                        return (
                            <>
                                {/* Header */}
                                <div className="bg-slate-900 px-7 pt-7 pb-6 shrink-0">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selected.isReturn ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {selected.isReturn ? <RotateCcw size={18} /> : <Truck size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium mb-0.5">Manifest ID</p>
                                                <p className="text-lg font-bold text-white tracking-tight">#{selected.id.slice(-12).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge status={selected.status} />
                                            <button onClick={() => setSelected(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Route cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1"><MapPin size={9} /> FROM</p>
                                            <p className="text-sm font-bold text-white truncate">{from}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1"><Navigation size={9} /> TO</p>
                                            <p className="text-sm font-bold text-white truncate">{to}</p>
                                        </div>
                                    </div>

                                    {selected.isReturn && selected.parentTransferId && (
                                        <div className="mt-3 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
                                            <AlertCircle size={14} className="text-rose-400 shrink-0" />
                                            <p className="text-xs text-rose-300 font-medium">Return of manifest #{selected.parentTransferId.slice(-6).toUpperCase()}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scrollable body */}
                                <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                                    {/* Items */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Items</p>
                                            <span className="text-[10px] text-slate-400 font-medium">{selected.items.length} product(s)</span>
                                        </div>
                                        <div className="space-y-2">
                                            {selected.items.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                    <div className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                        <ShoppingBag size={15} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">{item.product?.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Qty: <span className="font-semibold text-slate-700">{item.quantity}</span>
                                                            {item.returnedQuantity > 0 && (
                                                                <span className="ml-2 text-rose-500 font-semibold">· {item.returnedQuantity} rejected</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {!selected.isReturn && selected.shippedAt && selected.status !== 'PAID' && (
                                                        <div className="shrink-0 flex items-center gap-2">
                                                            <span className="text-xs text-slate-400">Return</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.quantity}
                                                                placeholder="0"
                                                                value={returns[item.id] || ''}
                                                                onChange={e => setReturns({ ...returns, [item.id]: parseInt(e.target.value) || 0 })}
                                                                className="w-16 h-9 bg-white border border-slate-200 rounded-lg text-center text-sm font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Settlement calc */}
                                    {selected.shippedAt && selected.status !== 'PAID' && !selected.isReturn && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Settlement</p>
                                            <div className="bg-slate-900 rounded-2xl p-5 grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 mb-1.5">Load Value</p>
                                                    <p className="text-lg font-bold text-white font-mono">{sym} {total.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-rose-400/80 mb-1.5">Return Credit</p>
                                                    <p className="text-lg font-bold text-rose-400 font-mono">-{sym} {retVal.toLocaleString()}</p>
                                                </div>
                                                <div className="border-l border-white/10 pl-4">
                                                    <p className="text-[10px] text-blue-400 mb-1.5">Net Owed</p>
                                                    <p className="text-2xl font-black text-blue-400 font-mono">{sym} {net.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Footer */}
                                <div className="px-7 pb-7 pt-4 border-t border-slate-100 space-y-3 shrink-0">
                                    {/* Ship */}
                                    {!selected.shippedAt && !selected.isReturn && (
                                        <button
                                            onClick={() => doAction(selected.id, 'SHIP')}
                                            disabled={!!loading}
                                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {loading === 'SHIP' ? <Loader2 className="animate-spin" size={17} /> : <Truck size={17} />}
                                            Mark as Shipped
                                        </button>
                                    )}

                                    {/* Pay */}
                                    {selected.shippedAt && selected.status !== 'PAID' && !selected.isReturn && (
                                        <button
                                            onClick={async () => {
                                                setLoading('SETTLE');
                                                const retData = Object.entries(returns)
                                                    .map(([itemId, qty]) => {
                                                        const item = selected.items.find((i: any) => i.id === itemId);
                                                        return { itemId, returnedQty: qty as number, productId: item?.productId || '' };
                                                    })
                                                    .filter(r => r.returnedQty > 0);

                                                if (retData.length > 0) {
                                                    const r = await processPartialReturn(selected.id, retData);
                                                    if (!r.success) { toast.error(r.error || 'Return error'); setLoading(null); return; }
                                                } else {
                                                    await updateTransportStatus(selected.id, 'DELIVER');
                                                }

                                                const r = await updateTransportStatus(selected.id, 'PAID');
                                                if (r.success) {
                                                    toast.success('Settled & delivered');
                                                    setSelected(null);
                                                    setReturns({});
                                                    router.refresh();
                                                } else {
                                                    toast.error(r.error || 'Payment failed');
                                                }
                                                setLoading(null);
                                            }}
                                            disabled={!!loading}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {loading === 'SETTLE' ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                                            {hasReturns ? 'Process Returns & Pay' : 'Confirm & Pay'}
                                            <span className="font-black opacity-70 ml-1">{sym} {net.toLocaleString()}</span>
                                        </button>
                                    )}

                                    {selected.status === 'PAID' && (
                                        <div className="w-full py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                                            <CheckCircle size={17} /> Paid & Delivered
                                        </div>
                                    )}

                                    {selected.isReturn && (
                                        <div className="w-full py-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                                            <RotateCcw size={17} /> Awaiting Admin Review
                                        </div>
                                    )}

                                    <button onClick={() => setSelected(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-sm font-medium transition-all">
                                        Close
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
