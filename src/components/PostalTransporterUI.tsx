'use client';

import React, { useState } from 'react';
import { Truck, Navigation, Package, Search, MapPin, CheckCircle2, QrCode, LogOut, Banknote, ShieldAlert } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { updateShipmentStatus, transporterScanAndAutoPickup } from '@/app/actions/postalOps';
import { cn } from '@/lib/utils';
import BarcodePrintDialog from './barcode/BarcodePrintDialog';
import { Printer } from 'lucide-react';

interface PostalTransporterUIProps {
    initialShipments: any[];
    transporter: any;
    currencySymbol?: string;
}

export default function PostalTransporterUI({ initialShipments, transporter, currencySymbol = '$' }: PostalTransporterUIProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'MY_CARGO' | 'SCAN_HUB'>('MY_CARGO');
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

    const handleScan = async (tracking: string) => {
        if (!tracking) return;
        if (!transporter?.postalActiveRoute) {
            return toast.error("Deployment Error: Declare your daily route at the sorting center first.");
        }

        setIsProcessing(true);
        const res = await transporterScanAndAutoPickup(tracking);
        setIsProcessing(false);
        
        if (res.success) {
            toast.success(`Verified: ${tracking} matches your route!`, {
                icon: <CheckCircle2 className="text-emerald-500" />
            });
            // Update local state if not already in cargo
            const existing = shipments.find(s => s.trackingNumber === tracking);
            if (existing) {
                setShipments(shipments.map(s => s.trackingNumber === tracking ? { ...s, transporterId: transporter.id, status: res.shipment.status } : s));
            } else {
                setShipments([res.shipment, ...shipments]);
            }
            setSearchQuery('');
        } else {
            toast.error(res.error, {
                icon: <ShieldAlert className="text-rose-500" />
            });
        }
    };

    const filtered = shipments.filter(s => {
        const matchesSearch = s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const isMyCargo = s.transporterId === transporter?.id;
        
        if (activeFilter === 'MY_CARGO') return matchesSearch && isMyCargo;
        if (activeFilter === 'SCAN_HUB') return matchesSearch && !isMyCargo;
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col animate-in fade-in duration-500 pb-20">
            {/* Identity Banner */}
            <div className="bg-slate-900 p-6 pb-24 relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-3xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <Truck size={28} strokeWidth={1.5} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white underline decoration-indigo-600 decoration-8 underline-offset-2">{transporter?.name}</h1>
                            <p className="text-[9px] text-indigo-300 font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Operational Node Active
                            </p>
                        </div>
                    </div>
                    <button onClick={() => signOut()} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-90">
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Route Lockdown Notification */}
                <div className="mt-8 relative z-10">
                    {transporter?.postalActiveRoute ? (
                        <div className="bg-indigo-600/20 backdrop-blur border border-indigo-400/30 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                            <div>
                                <p className="text-[9px] text-indigo-200 font-black uppercase tracking-[0.2em] mb-1 italic">Active Daily Route</p>
                                <p className="text-xl font-black text-white uppercase italic tracking-tighter">{transporter.postalActiveRoute}</p>
                            </div>
                            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                <p className="text-[10px] text-indigo-200 font-black italic">ROUTE LOCK ACCESS</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-rose-500/20 backdrop-blur border border-rose-400/30 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                             <ShieldAlert className="text-rose-400 shrink-0" size={24} />
                             <div>
                                <p className="text-[9px] text-rose-200 font-black uppercase tracking-[0.2em] mb-1 italic">Fleet Warning</p>
                                <p className="text-base font-black text-white uppercase italic tracking-tighter leading-none">Awaiting Deployment Route Assignment</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile-First Scanner / Toolbar */}
            <div className="px-5 -mt-12 group z-20 sticky top-4">
                <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-3xl p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Scan or Enter Manifest ID..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleScan(searchQuery);
                            }}
                            className="w-full pl-14 pr-14 h-16 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-base font-black shadow-inner outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-slate-300 tracking-tight italic"
                        />
                         <button 
                            onClick={() => handleScan(searchQuery)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
                        >
                            <QrCode size={20} />
                        </button>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                        <button 
                            onClick={() => setActiveFilter('MY_CARGO')}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                activeFilter === 'MY_CARGO' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            My Cargo ({shipments.filter(s => s.transporterId === transporter?.id).length})
                        </button>
                        <button 
                            onClick={() => setActiveFilter('SCAN_HUB')}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                activeFilter === 'SCAN_HUB' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Hub Registry
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <main className="flex-1 p-5 space-y-5 max-w-lg mx-auto w-full">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-4">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-inner">
                            <Package size={40} strokeWidth={1} className="opacity-20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Queue Clear: Waiting for Scan</p>
                    </div>
                ) : (
                    filtered.map(s => (
                        <div key={s.id} className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100 space-y-6 overflow-hidden relative group hover:border-indigo-200 transition-all">
                            {s.hasCod && (
                                <div className="absolute top-0 right-0 p-1 px-5 bg-amber-500 rounded-bl-3xl text-[10px] font-black text-white italic uppercase tracking-[0.2em] shadow-lg">
                                    Collect COD
                                </div>
                            )}

                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <span className="font-mono font-black text-xl text-slate-900 tracking-tighter select-all">{s.trackingNumber}</span>
                                    </div>
                                    <div className={cn(
                                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg w-fit italic border",
                                        s.status?.includes('TRANSIT') ? "bg-indigo-600 text-white border-indigo-500 shadow-xl" : "bg-slate-100 text-slate-500 border-slate-200"
                                    )}>
                                        {s.status?.replace(/_/g, ' ') || 'UNVERIFIED'}
                                    </div>
                                </div>
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all border border-slate-100">
                                    <Printer size={20} onClick={() => setPrintShipment(s)} />
                                </div>
                            </div>

                            <div className="space-y-5 py-6 border-y border-slate-50">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recipient Identity</p>
                                        <p className="text-sm font-black text-slate-900 italic uppercase leading-none mb-1">{s.recipientName}</p>
                                        <p className="text-[11px] font-bold text-slate-500 leading-tight">{s.recipientAddress}</p>
                                    </div>
                                </div>

                                {s.hasCod && (
                                    <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                                                <Banknote size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Amount Due</p>
                                                <p className="text-2xl font-black text-amber-600 italic tracking-tighter">{currencySymbol}{Number(s.codAmount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                {s.transporterId === transporter?.id ? (
                                    <>
                                        {(s.status === 'IN_TRANSIT_TO_SORTING' || s.status === 'ASSIGNED_FOR_PICKUP') && (
                                            <button 
                                                onClick={() => handleUpdateStatus(s.id, 'AT_SORTING_CENTER')}
                                                disabled={isProcessing}
                                                className="flex-1 h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all italic"
                                            >
                                                Drop @ Sorting Hub
                                            </button>
                                        )}
                                        {s.status === 'IN_TRANSIT_TO_DESTINATION' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(s.id, 'ARRIVED_AT_HUB')}
                                                disabled={isProcessing}
                                                className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all italic flex items-center justify-center gap-3"
                                            >
                                                <Navigation size={18} /> Offload @ Hub
                                            </button>
                                        )}
                                        {s.status === 'ARRIVED_AT_HUB' && (
                                            <div className="flex-1 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center italic gap-3 border border-emerald-100">
                                                <CheckCircle2 size={18} /> Manifest Handover
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => handleScan(s.trackingNumber)}
                                        disabled={isProcessing}
                                        className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all italic flex items-center justify-center gap-3"
                                    >
                                        <QrCode size={18} /> Auto-Capture Package
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            <BarcodePrintDialog 
                product={printShipment}
                isOpen={!!printShipment}
                onClose={() => setPrintShipment(null)}
                currencySymbol={currencySymbol}
            />
        </div>
    );
}
