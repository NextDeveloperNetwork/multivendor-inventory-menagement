'use client';

import React, { useState } from 'react';
import { Truck, Navigation, Package, Search, MapPin, CheckCircle2, QrCode, LogOut, Banknote } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { updateShipmentStatus } from '@/app/actions/postalOps';
import { cn } from '@/lib/utils';
import BarcodePrintDialog from './barcode/BarcodePrintDialog';
import { Printer } from 'lucide-react';

interface PostalTransporterUIProps {
    initialShipments: any[];
    currencySymbol?: string;
}

export default function PostalTransporterUI({ initialShipments, currencySymbol = '$' }: PostalTransporterUIProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PICKUP' | 'SORTING' | 'DESTINATION'>('ALL');
    const [printShipment, setPrintShipment] = useState<any>(null);

    const handleUpdateStatus = async (id: string, status: string) => {
        setIsProcessing(true);
        const res = await updateShipmentStatus(id, status);
        setIsProcessing(false);
        
        if (res.success) {
            toast.success(`Package marked as ${status.replace(/_/g, ' ')}`);
            setShipments(shipments.map(s => s.id === id ? { ...s, status } : s));
        } else {
            toast.error(res.error);
        }
    };

    const filtered = shipments.filter(s => {
        const matchesSearch = s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeFilter === 'ALL') return matchesSearch;
        if (activeFilter === 'PICKUP') return matchesSearch && s.status === 'PENDING_PICKUP';
        if (activeFilter === 'SORTING') return matchesSearch && s.status === 'IN_TRANSIT_TO_SORTING';
        if (activeFilter === 'DESTINATION') return matchesSearch && s.status === 'IN_TRANSIT_TO_DESTINATION';
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-500">
            {/* Mobile Header */}
            <header className="bg-indigo-950 text-white p-6 sticky top-0 z-50 shadow-2xl border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                            <Truck size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter leading-none italic">Fleet Ops</h1>
                            <p className="text-[9px] text-indigo-300 font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Logistics Hub Active
                            </p>
                        </div>
                    </div>
                    <button onClick={() => signOut()} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-90">
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Quick Stats Scroll */}
                <div className="flex gap-3 overflow-x-auto mt-8 pb-1 no-scrollbar">
                    <button onClick={() => setActiveFilter('ALL')} className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0", activeFilter === 'ALL' ? "bg-white text-indigo-950 border-white shadow-xl shadow-black/20 italic" : "bg-white/5 border-white/10 text-indigo-200")}>
                        Registry ({shipments.length})
                    </button>
                    {(['PICKUP', 'SORTING', 'DESTINATION'] as const).map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)} 
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0", 
                                activeFilter === filter ? "bg-indigo-500 border-indigo-400 text-white shadow-xl shadow-indigo-500/20 italic" : "bg-white/5 border-white/10 text-indigo-200"
                            )}
                        >
                            {filter} ({shipments.filter(s=> 
                                filter === 'PICKUP' ? s.status === 'PENDING_PICKUP' : 
                                filter === 'SORTING' ? s.status === 'IN_TRANSIT_TO_SORTING' : 
                                s.status === 'IN_TRANSIT_TO_DESTINATION'
                            ).length})
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Feed */}
            <main className="flex-1 p-5 space-y-5 max-w-lg mx-auto w-full">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Scan Barcode or Type Tracking..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-12 h-14 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black shadow-sm outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-black tracking-tight"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-90 transition-all hover:text-indigo-600">
                        <QrCode size={18} />
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-4">
                        <Package size={64} strokeWidth={1} className="opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Scanning Network Taskbar...</p>
                    </div>
                ) : (
                    filtered.map(s => (
                        <div key={s.id} className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 border border-slate-100 space-y-5 overflow-hidden relative">
                            {s.hasCod && (
                                <div className="absolute top-0 right-0 p-1 px-4 bg-amber-500 rounded-bl-2xl text-[9px] font-black text-white italic uppercase tracking-[0.2em] shadow-lg">
                                    Cash Collection
                                </div>
                            )}

                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse border-4 border-indigo-100" />
                                        <span className="font-mono font-black text-lg text-slate-900 tracking-tighter select-all">{s.trackingNumber}</span>
                                    </div>
                                    <div className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg w-fit italic",
                                        s.status === 'PENDING_PICKUP' ? "bg-amber-100 text-amber-700" : 
                                        s.status === 'IN_TRANSIT_TO_SORTING' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" :
                                        "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                    )}>
                                        {s.status.replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <div>
                                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">{s.recipientName}</div>
                                        <div className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter italic">{s.weight} KG Manifest</div>
                                    </div>
                                    <button 
                                        onClick={() => setPrintShipment({ ...s, barcode: s.trackingNumber, name: `Shipment: ${s.recipientName}`, price: null })}
                                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:bg-white"
                                    >
                                        <Printer size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 py-4 border-y border-slate-50 relative">
                                <div className="flex items-start gap-4 group">
                                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Origin Source</p>
                                        <p className="text-xs font-black text-slate-800 italic uppercase">{s.originManager?.name || 'Authorized Regional Node'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100">
                                        <Navigation size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target Destination</p>
                                        <p className="text-xs font-bold text-slate-600 tracking-tight leading-tight">{s.recipientAddress}</p>
                                    </div>
                                </div>
                                
                                {s.hasCod && (
                                    <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100 mt-2">
                                        <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                            <Banknote size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Collect on Receipt</p>
                                            <p className="text-2xl font-black text-amber-600 tabular-nums italic tracking-tighter leading-none">{currencySymbol}{Number(s.codAmount).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile-First Trigger */}
                            <div className="flex gap-3">
                                {s.status === 'PENDING_PICKUP' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(s.id, 'IN_TRANSIT_TO_SORTING')}
                                        disabled={isProcessing}
                                        className="flex-1 h-16 bg-indigo-600 hover:bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all italic"
                                    >
                                        In-Take Package
                                    </button>
                                )}
                                {s.status === 'IN_TRANSIT_TO_SORTING' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(s.id, 'AT_SORTING_CENTER')}
                                        disabled={isProcessing}
                                        className="flex-1 h-16 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all italic"
                                    >
                                        Unload at Transit
                                    </button>
                                )}
                                {s.status === 'IN_TRANSIT_TO_DESTINATION' && (
                                    <div className="flex-1 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center italic gap-3">
                                        <CheckCircle2 size={18} /> Approaching Hub
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Bottom Nav Spacer */}
            <div className="h-24" />

            {/* Print Dialog */}
            <BarcodePrintDialog 
                product={printShipment}
                isOpen={!!printShipment}
                onClose={() => setPrintShipment(null)}
                currencySymbol={currencySymbol}
            />
        </div>
    );
}
