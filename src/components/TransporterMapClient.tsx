'use client';

import { useState, useMemo } from 'react';
import { Truck, Navigation, Package, X, CheckCircle, RotateCcw, Clock } from 'lucide-react';
import MapWrapper from '@/components/MapWrapper';

interface TransporterMapClientProps {
    transfers: any[];
}

export default function TransporterMapClient({ transfers: serverTransfers }: TransporterMapClientProps) {
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    const activeTransfers = useMemo(
        () => serverTransfers.filter(t => !dismissedIds.includes(t.id)),
        [serverTransfers, dismissedIds]
    );

    const { uniqueLocations, paths } = useMemo(() => {
        const locationMap = new Map<string, any>();
        const paths: any[] = [];

        activeTransfers.forEach((t: any) => {
            const from = t.fromWarehouse || t.fromShop;
            const to   = t.toWarehouse   || t.toShop;

            const label = `${t.status} · #${t.id.slice(-6).toUpperCase()}`;
            const desc  = `Manifest: #${t.id.slice(-8).toUpperCase()}\nItems: ${t.items?.length || 0}\nStatus: ${t.status}`;

            if (from?.latitude && from?.longitude) {
                locationMap.set(`FROM_${from.id}_${t.id}`, {
                    id: `FROM_${from.id}_${t.id}`,
                    name: from.name,
                    latitude: from.latitude,
                    longitude: from.longitude,
                    type: t.fromWarehouse ? 'warehouse' : 'shop',
                    label,
                    description: `Origin: ${from.name}\n\n${desc}`,
                    status: t.status,
                });
            }

            if (to?.latitude && to?.longitude) {
                locationMap.set(`TO_${to.id}_${t.id}`, {
                    id: `TO_${to.id}_${t.id}`,
                    name: to.name,
                    latitude: to.latitude,
                    longitude: to.longitude,
                    type: t.toWarehouse ? 'warehouse' : 'shop',
                    label,
                    description: `Destination: ${to.name}\n\n${desc}`,
                    status: t.status,
                });
            }

            if (from?.latitude && from?.longitude && to?.latitude && to?.longitude) {
                paths.push({
                    id: t.id,
                    from: [from.latitude, from.longitude],
                    to:   [to.latitude,   to.longitude],
                    status: t.status,
                    transporter: 'ACTIVE',
                });
            }
        });

        return { uniqueLocations: Array.from(locationMap.values()), paths };
    }, [activeTransfers]);

    const statusConfig: Record<string, { label: string; icon: React.ElementType; cls: string; dot: string }> = {
        SHIPPED:         { label: 'In Transit',     icon: Truck,        cls: 'bg-amber-50 border-amber-200 text-amber-700',   dot: 'bg-amber-500 animate-pulse' },
        PENDING:         { label: 'Pending',        icon: Clock,        cls: 'bg-slate-50 border-slate-200 text-slate-600',   dot: 'bg-slate-400' },
        DELIVERED:       { label: 'Delivered',      icon: CheckCircle,  cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
        PAID:            { label: 'Paid',           icon: CheckCircle,  cls: 'bg-blue-50 border-blue-200 text-blue-700',      dot: 'bg-blue-500' },
        PARTIAL_RETURN:  { label: 'Partial Return', icon: RotateCcw,    cls: 'bg-rose-50 border-rose-200 text-rose-700',      dot: 'bg-rose-500 animate-pulse' },
    };

    return (
        <div className="relative h-full w-full">
            {/* Map fills the container */}
            <MapWrapper locations={uniqueLocations} paths={paths} />

            {/* Sidebar panel — top-left overlay */}
            <div className="absolute top-4 left-4 z-[1000] w-72 max-h-[calc(100%-2rem)] flex flex-col gap-3 pointer-events-none">
                {/* Manifest list */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden pointer-events-auto">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Truck size={15} className="text-blue-600" />
                            <span className="text-sm font-bold text-slate-900">Active Routes</span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{activeTransfers.length}</span>
                    </div>

                    <div className="overflow-y-auto max-h-[50vh] divide-y divide-slate-50">
                        {activeTransfers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                <Package size={28} strokeWidth={1.2} className="mb-2" />
                                <p className="text-xs font-medium text-slate-400">No active routes</p>
                            </div>
                        ) : (
                            activeTransfers.map((t: any) => {
                                const cfg = statusConfig[t.status] || { label: t.status, icon: Package, cls: 'bg-slate-50 border-slate-200 text-slate-500', dot: 'bg-slate-400' };
                                const Icon = cfg.icon;
                                const to = t.toWarehouse?.name || t.toShop?.name || '—';
                                const from = t.fromWarehouse?.name || t.fromShop?.name || '—';

                                return (
                                    <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-all">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${cfg.cls}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-xs font-bold text-slate-900">#{t.id.slice(-6).toUpperCase()}</span>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate">{from} → {to}</p>
                                        </div>
                                        <button
                                            onClick={() => setDismissedIds(prev => [...prev, t.id])}
                                            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all shrink-0"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
