'use client';

import { useState, useMemo } from 'react';
import MapWrapper from './MapWrapper';
import { 
    Truck, 
    MapPin, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Search,
    ChevronRight,
    ArrowRight,
    Package,
    Navigation,
    User
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { updateTransportStatus } from '@/app/actions/transportation';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LogisticsClientProps {
    transfers: any[];
    locations: any[];
    transporters: any[];
}

export default function LogisticsClient({ transfers, locations, transporters }: LogisticsClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const filteredTransfers = useMemo(() => {
        return transfers.filter(t => {
            const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) || 
                                (t.transporter?.name || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [transfers, search, statusFilter]);

    const activeTransfer = useMemo(() => {
        return transfers.find(t => t.id === selectedTransferId);
    }, [transfers, selectedTransferId]);

    // Map data: nodes (shops/warehouses) and paths (transfers)
    const mapLocations = useMemo(() => {
        return locations.map(l => ({
            ...l,
            type: l.latitude ? (l.id.startsWith('shop') ? 'shop' : 'warehouse') : 'node'
        }));
    }, [locations]);

    const transferPaths = useMemo(() => {
        return filteredTransfers
            .filter(t => {
                const source = t.fromShop || t.fromWarehouse;
                const dest = t.toShop || t.toWarehouse;
                return source?.latitude && dest?.latitude;
            })
            .map(t => {
                const source = t.fromShop || t.fromWarehouse;
                const dest = t.toShop || t.toWarehouse;
                return {
                    id: t.id,
                    from: [source.latitude, source.longitude],
                    to: [dest.latitude, dest.longitude],
                    status: t.status,
                    transporter: t.transporter?.name || 'Unassigned'
                };
            });
    }, [filteredTransfers]);

    const handleStatusMove = async (id: string, newStatus: 'SHIPPED' | 'DELIVERED') => {
        const res = await updateTransportStatus(id, newStatus);
        if (res.success) {
            toast.success(`Transfer status updated to ${newStatus}`);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to update status");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] gap-6 p-4 md:p-8 bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                        <Truck size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                            Fleet <span className="text-indigo-600">Command</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            Real-time Logistics Monitoring & Global Routing
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH_MANIFEST_ID/FLEET_UNIT..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono italic text-slate-900"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
                {/* Map View */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden flex flex-col group/map">
                    <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
                        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 shadow-2xl space-y-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100 pb-2">Fleet Status View</h3>
                            <div className="flex flex-col gap-2">
                                {['ALL', 'ASSIGNED', 'SHIPPED', 'DELIVERED'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${
                                            statusFilter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {s} ({s === 'ALL' ? transfers.length : transfers.filter(t => t.status === s).length})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-slate-100 relative">
                        {/* Placeholder for Map - In a real app we'd use Leaflet/Google Maps */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Navigation size={400} />
                        </div>
                        
                        {/* Interactive Elements would go here */}
                        <div className="p-8 relative z-10 h-full">
                            <MapWrapper 
                                locations={mapLocations}
                                paths={transferPaths}
                                onLocationSelect={() => {}}
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 z-10">
                        <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center justify-between text-white">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1 italic">Active Routes</span>
                                    <span className="text-2xl font-black tabular-nums tracking-tighter italic">{transferPaths.length}</span>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1 italic">Fleet Utilization</span>
                                    <span className="text-2xl font-black tabular-nums tracking-tighter italic">
                                        {Math.round((transfers.filter(t => t.transporterId).length / (transporters.length || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">System Status</p>
                                    <p className="text-sm font-black italic">FLEET_SYNC_ACTIVE</p>
                                </div>
                                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List View */}
                <div className="w-full xl:w-[450px] flex flex-col gap-6 shrink-0 min-h-0">
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                                <Clock size={20} className="text-indigo-600" />
                                Logistics Manifest
                            </h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Scheduled & On-route Internal Transfers</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="space-y-3">
                                {filteredTransfers.length === 0 ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                                            <Package size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No matching manifestations found</p>
                                    </div>
                                ) : (
                                    filteredTransfers.map((t) => (
                                        <div 
                                            key={t.id}
                                            onClick={() => setSelectedTransferId(t.id)}
                                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                                                selectedTransferId === t.id 
                                                ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-indigo-500/10' 
                                                : 'bg-white border-slate-100 hover:border-indigo-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border font-mono italic ${
                                                    t.status === 'DELIVERED' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : t.status === 'SHIPPED' 
                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {t.status}
                                                </div>
                                                <div className={`text-[9px] font-black font-mono italic ${selectedTransferId === t.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                    #{t.id.slice(-8).toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="flex-1 space-y-1">
                                                    <p className={`text-[8px] font-black uppercase tracking-widest italic ${selectedTransferId === t.id ? 'text-white/50' : 'text-slate-400'}`}>Origin</p>
                                                    <p className={`text-xs font-black italic truncate ${selectedTransferId === t.id ? 'text-white' : 'text-slate-900'}`}>{t.fromShop?.name || t.fromWarehouse?.name}</p>
                                                </div>
                                                <ArrowRight size={14} className={selectedTransferId === t.id ? 'text-white/30' : 'text-slate-200'} />
                                                <div className="flex-1 space-y-1 text-right">
                                                    <p className={`text-[8px] font-black uppercase tracking-widest italic ${selectedTransferId === t.id ? 'text-white/50' : 'text-slate-400'}`}>Target</p>
                                                    <p className={`text-xs font-black italic truncate ${selectedTransferId === t.id ? 'text-white' : 'text-slate-900'}`}>{t.toShop?.name || t.toWarehouse?.name}</p>
                                                </div>
                                            </div>

                                            <div className={`flex items-center justify-between pt-4 border-t ${selectedTransferId === t.id ? 'border-white/5' : 'border-slate-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedTransferId === t.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        <User size={12} />
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-tight italic ${selectedTransferId === t.id ? 'text-white/70' : 'text-slate-500'}`}>
                                                        {t.transporter?.name || 'GENERIC_FLEET'}
                                                    </span>
                                                </div>
                                                <div className={`text-[9px] font-black italic tabular-nums ${selectedTransferId === t.id ? 'text-white/40' : 'text-slate-300'}`}>
                                                    {formatDateTime(t.date)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Control Panel */}
                    <div className={`p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl transition-all duration-500 ${selectedTransferId ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-50 grayscale pointer-events-none'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">Unit Deployment Control</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Ref: #{selectedTransferId?.slice(-8).toUpperCase()}</p>
                            </div>
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <Navigation size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => activeTransfer && handleStatusMove(activeTransfer.id, 'SHIPPED')}
                                disabled={activeTransfer?.status === 'SHIPPED' || activeTransfer?.status === 'DELIVERED'}
                                className="flex flex-col items-center gap-3 p-4 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl border border-slate-100 transition-all group disabled:opacity-40"
                            >
                                <Truck size={20} className="text-indigo-600 group-hover:text-white" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">Start Transit</span>
                            </button>
                            <button 
                                onClick={() => activeTransfer && handleStatusMove(activeTransfer.id, 'DELIVERED')}
                                disabled={activeTransfer?.status === 'DELIVERED'}
                                className="flex flex-col items-center gap-3 p-4 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-2xl border border-slate-100 transition-all group disabled:opacity-40"
                            >
                                <CheckCircle2 size={20} className="text-emerald-500 group-hover:text-white" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">Verify Arrival</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
