'use client';

import React, { useState } from 'react';
import { Package, Search, Navigation, MapPin, CheckCircle2, AlertCircle, Barcode, Landmark, History, Layers, Route as RouteIcon, Truck, Map, Send, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { setTransporterRoute } from '@/app/actions/postalOps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PostalSortingClientProps {
    initialShipments: any[];
    managers: any[];
    transporters: any[];
    currencySymbol?: string;
}

export default function PostalSortingClient({ 
    initialShipments, 
    managers, 
    transporters: initialTransporters,
    currencySymbol = '$' 
}: PostalSortingClientProps) {
    const [shipments] = useState(initialShipments);
    const [transporters, setTransporters] = useState(initialTransporters);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [editingRoutes, setEditingRoutes] = useState<Record<string, string>>({});

    const handleSaveRoute = async (transporterId: string) => {
        const route = editingRoutes[transporterId];
        if (route === undefined) return;
        
        setIsRefreshing(true);
        const res = await setTransporterRoute(transporterId, route);
        setIsRefreshing(false);
        
        if (res.success) {
            toast.success('Fleet route updated successfully');
            setTransporters(transporters.map(t => t.id === transporterId ? { ...t, postalActiveRoute: route } : t));
        } else {
            toast.error('Failed to update route');
        }
    };

    const filteredTransporters = transporters.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.postalActiveRoute || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
            {/* Identity Banner */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 shadow-2xl p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border border-white/5">
                <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />

                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-white/5 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl border border-white/10 shrink-0">
                        <Map size={40} strokeWidth={1.5} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">Route Control</h1>
                        <p className="text-[11px] text-indigo-300 font-black uppercase tracking-[0.4em] flex items-center gap-3">
                             <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-8 ring-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.5)]"/>
                             Fleet Deployment Center
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10 w-full lg:w-auto">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-center min-w-[180px] hover:bg-white/10 transition-all border-b-4 border-indigo-500">
                        <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1 leading-none italic">Active Transporters</p>
                        <p className="text-4xl font-black text-white tabular-nums tracking-tighter italic">{transporters.length}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-center min-w-[180px] hover:bg-white/10 transition-all border-b-4 border-emerald-500">
                        <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1 leading-none italic">Packages in Hub</p>
                        <p className="text-4xl font-black text-white tabular-nums tracking-tighter italic">{shipments.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
                {/* Fleet Management */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-3">
                            <Truck size={18} className="text-indigo-600" /> Deployment Registry
                        </h2>
                        <div className="relative group w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search Fleet Units..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 h-11 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTransporters.map(t => (
                            <div key={t.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl" />
                                
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl italic uppercase shadow-xl transform group-hover:rotate-6 transition-transform">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{t.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Assigned Daily Route</label>
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="e.g. City Name, Hub Address..."
                                                value={editingRoutes[t.id] !== undefined ? editingRoutes[t.id] : (t.postalActiveRoute || '')}
                                                onChange={e => setEditingRoutes({...editingRoutes, [t.id]: e.target.value})}
                                                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-400 transition-all outline-none"
                                            />
                                            <button 
                                                onClick={() => handleSaveRoute(t.id)}
                                                disabled={isRefreshing}
                                                className="w-12 h-12 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                                            >
                                                <Save size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            t.postalActiveRoute ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                        )} />
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                            {t.postalActiveRoute ? `Deployed to: ${t.postalActiveRoute}` : 'Standing By / No Route'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hub Queue Preview */}
                <div className="space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-3">
                        <Barcode size={18} className="text-indigo-600" /> Incoming Manifests
                    </h2>
                    
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-4 space-y-4 max-h-[700px] overflow-y-auto no-scrollbar">
                        {shipments.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto border-2 border-dashed border-slate-100">
                                    <History size={24} />
                                </div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Scanning Node Queue...</p>
                            </div>
                        ) : shipments.map(s => (
                            <div key={s.id} className="bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 p-5 rounded-3xl transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 tracking-tight leading-none mb-1 font-mono">{s.trackingNumber}</p>
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest opacity-60 leading-none">{s.recipientName}</p>
                                    </div>
                                    <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 tracking-tighter uppercase">{s.weight} KG</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 mb-4">
                                    <MapPin size={14} className="shrink-0" />
                                    <p className="text-[10px] font-medium leading-tight line-clamp-1">{s.recipientAddress}</p>
                                </div>
                                <div className="pt-3 border-t border-slate-100/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    {s.hasCod && (
                                        <p className="text-[10px] font-black text-amber-600 italic">{currencySymbol}{Number(s.codAmount).toFixed(2)}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
