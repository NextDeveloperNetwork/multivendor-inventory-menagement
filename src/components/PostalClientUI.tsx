'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, MapPin, Navigation, Printer, ArrowRight, QrCode, CreditCard, Banknote, Info, TrendingUp, Truck, CheckCircle2, Clock, Scale, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClientShipment } from '@/app/actions/postalOps';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarcodeGenerator } from './barcode/components/BarcodeGenerator';

interface PostalClientUIProps {
    initialShipments: any[];
    manager: any | null;
    currencySymbol?: string;
}

const StatsCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] border border-slate-100 p-6 flex items-center justify-between shadow-sm group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{value}</p>
                {subValue && <span className="text-[10px] font-bold text-slate-400 uppercase italic">{subValue}</span>}
            </div>
        </div>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", color)}>
            <Icon size={24} strokeWidth={1.5} />
        </div>
    </div>
);

export default function PostalClientUI({ initialShipments, manager, currencySymbol = '$' }: PostalClientUIProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [activeTab, setActiveTab ] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    
    // Form State
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [packageValue, setPackageValue] = useState('');
    const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'COD'>('PREPAID');
    const [isProcessing, setIsProcessing] = useState(false);

    const guidelines = [
        { title: "Standard Transit", desc: "Estimated 24-48h delivery within regional zones." },
        { title: "COD Processing", desc: "Funds are settled within 24h of successful delivery." },
        { title: "Weight Limits", desc: "Max unit weight is 30KG for standard regional air." }
    ];

    // Derived Stats
    const stats = {
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'PENDING' || s.status === 'PENDING_PICKUP' || !s.status).length,
        delivered: shipments.filter(s => s.status === 'DELIVERED').length,
        inTransit: shipments.filter(s => s.status && s.status.includes('TRANSIT')).length,
        totalValue: shipments.reduce((acc, s) => acc + Number(s.codAmount || 0), 0),
        totalWeight: shipments.reduce((acc, s) => acc + Number(s.weight || 0), 0)
    };

    // Calculated Fee
    const [estimatedFee, setEstimatedFee] = useState(0);

    useEffect(() => {
        const base = manager?.postalBaseFee || 5;
        const w = Number(weight) || 0;
        setEstimatedFee(Number(base) + (w * 2));
    }, [weight, manager]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const res = await createClientShipment({
            recipientName, 
            recipientAddress, 
            recipientPhone, 
            weight: Number(weight), 
            notes,
            packageValue: Number(packageValue),
            hasCod: paymentMode === 'COD'
        });
        setIsProcessing(true); // Keep processing momentarily for aesthetic
        setTimeout(() => setIsProcessing(false), 500);

        if (res.success) {
            toast.success('Shipment Registered Successfully');
            setShipments([res.shipment, ...shipments]);
            setIsCreateOpen(false);
            setRecipientName(''); setRecipientAddress(''); setRecipientPhone(''); setWeight(''); setNotes(''); setPackageValue(''); setPaymentMode('PREPAID');
        } else {
            toast.error(res.error);
        }
    };

    const handlePrint = (shipment: any) => {
        setSelectedShipment(shipment);
        setIsPrintOpen(true);
    };

    const filtered = shipments.filter(s => {
        const matchesSearch = s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             s.recipientAddress.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'ALL') return matchesSearch;
        if (activeTab === 'PENDING') return matchesSearch && (s.status === 'PENDING' || s.status === 'PENDING_PICKUP' || !s.status);
        if (activeTab === 'DELIVERED') return matchesSearch && s.status === 'DELIVERED';
        if (activeTab === 'IN_TRANSIT') return matchesSearch && s.status && s.status.includes('TRANSIT');
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Identity Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-2xl p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 border border-slate-800">
                <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px]" />

                <div className="flex items-center gap-8 relative z-10">
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-20 h-20 bg-slate-900 border border-white/10 rounded-[2rem] flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-all active:scale-95 shadow-2xl" onClick={() => signOut()}>
                            <Package size={40} className="text-indigo-400 group-hover:text-indigo-300 group-hover:rotate-12 transition-all" strokeWidth={1} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Client Portal</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse ring-4 ring-indigo-500/20"/>
                                Station: {manager?.name || 'Central Hub'}
                            </p>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">v2.0.4 - ACTIVE_SESSION</p>
                        </div>
                    </div>
                </div>

                <div className="inline-flex h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 relative z-10 group hover:border-white/20 transition-all">
                    <div className="px-8 flex flex-col justify-center border-r border-white/5">
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">Manifest Count</p>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{shipments.length}</p>
                    </div>
                    <div className="px-8 flex flex-col justify-center bg-white/[0.02] rounded-2xl">
                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-1">Total COD Value</p>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{currencySymbol}{stats.totalValue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                    title="Active Transit" 
                    value={stats.inTransit} 
                    icon={Truck} 
                    color="bg-indigo-50 text-indigo-600" 
                    subValue="Units pending"
                />
                <StatsCard 
                    title="Awaiting Pickup" 
                    value={stats.pending} 
                    icon={Clock} 
                    color="bg-amber-50 text-amber-600" 
                    subValue="Station side"
                />
                <StatsCard 
                    title="Delivered" 
                    value={stats.delivered} 
                    icon={CheckCircle2} 
                    color="bg-emerald-50 text-emerald-600" 
                    subValue="Success rate"
                />
                <StatsCard 
                    title="Gross Weight" 
                    value={`${stats.totalWeight.toFixed(1)}KG`} 
                    icon={Scale} 
                    color="bg-blue-50 text-blue-600" 
                    subValue="Volume metric"
                />
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Manifest Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-slate-100 p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
                            {(['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-nowrap",
                                        activeTab === tab 
                                            ? "bg-white text-indigo-600 shadow-sm" 
                                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                    )}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                <input 
                                    type="text"
                                    placeholder="Search Active Manifests..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold tracking-wider placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none text-slate-900 shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={() => setIsCreateOpen(true)}
                                className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
                            >
                                <Plus size={16} strokeWidth={3} /> Submit Dispatch
                            </button>
                        </div>
                    </div>

                    {/* Manifest Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.map(s => (
                            <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-2 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group shadow-sm overflow-hidden border-l-8 border-l-indigo-600">
                                <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto p-4 md:p-2">
                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                                        <QrCode size={32} strokeWidth={1} />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] font-mono">{new Date(s.createdAt).toLocaleDateString()}</p>
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-none flex items-center gap-1",
                                                s.hasCod ? "bg-amber-100 text-amber-700 font-bold italic" : "bg-emerald-100 text-emerald-700 font-bold italic"
                                            )}>
                                                {s.hasCod ? <Banknote size={10}/> : <CreditCard size={10}/>}
                                                {s.hasCod ? 'COD ENFORCED' : 'FULL PREPAID'}
                                            </span>
                                            {s.status && (
                                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest">
                                                    {s.status.replace(/_/g, ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter leading-none mb-3 group-hover:text-indigo-600 transition-colors uppercase">{s.trackingNumber}</p>
                                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                            <div className="flex items-center gap-2 group/info">
                                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover/info:bg-indigo-50 transition-colors">
                                                     <User size={12} className="text-slate-400 group-hover/info:text-indigo-500" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-wide">{s.recipientName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 group/info">
                                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover/info:bg-indigo-50 transition-colors">
                                                     <MapPin size={12} className="text-slate-400 group-hover/info:text-indigo-500" />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[200px]">{s.recipientAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 p-6 md:p-8 bg-slate-50/50">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{s.hasCod ? 'COLLECT AMOUNT' : 'LOGISTICS FEE'}</p>
                                        <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter italic">
                                            <span className="text-slate-300 mr-1 not-italic font-bold">{currencySymbol}</span>
                                            {s.hasCod ? Number(s.codAmount).toFixed(2) : Number(s.shippingFee).toFixed(2)}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handlePrint(s)}
                                        className="h-16 px-8 bg-slate-950 text-white rounded-[1.5rem] font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                    >
                                        <Printer size={16} /> Print Label
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-widest mb-2">No Operations Found</h3>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Adjust filters or initialize a new dispatch</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Intelligence */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
                            <TrendingUp size={80} strokeWidth={1} />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Logistics Intelli</h4>
                        <div className="space-y-6 relative z-10">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Network Status</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <p className="text-sm font-black tracking-tight uppercase">Optimal Flow</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Avg. Delivery</p>
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-indigo-400" />
                                    <p className="text-sm font-black tracking-tight uppercase">1.2 Transit Days</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-6 flex items-center gap-2">
                             Guidelines
                        </h4>
                        <div className="space-y-5">
                            {guidelines.map((g, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-wide">{g.title}</p>
                                    <p className="text-[9px] font-medium text-indigo-100 opacity-70 leading-relaxed uppercase tracking-tight">{g.desc}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 italic">
                            Full Service Terms
                        </button>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={16} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Service Alert</h4>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight italic">
                            High volume detected in Northern Hub. Anticipate +4h transit delay for heavy units.
                        </p>
                    </div>
                </div>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-white rounded-[3rem] border-slate-200 shadow-3xl p-10 max-w-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />
                    
                    <DialogHeader className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">New Dispatch</DialogTitle>
                                <DialogDescription className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 flex items-center gap-2 font-mono">
                                    <Info size={12} className="text-indigo-400" /> Initialize Regional Transit Operation
                                </DialogDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Fee</p>
                                <p className="text-3xl font-black text-indigo-600 tabular-nums italic tracking-tighter">{currencySymbol}{estimatedFee.toFixed(2)}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Recipient Identity</label>
                                <input required placeholder="Enter Full Name" value={recipientName} onChange={e=>setRecipientName(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all" />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Phone</label>
                                <input required placeholder="+00..." value={recipientPhone} onChange={e=>setRecipientPhone(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-mono" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Delivery Destination</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input required placeholder="Full Transit Address" value={recipientAddress} onChange={e=>setRecipientAddress(e.target.value)} className="w-full h-14 pl-14 pr-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all" />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 col-span-2 my-2" />

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Weight (KG)</label>
                                <input type="number" step="0.1" required placeholder="0.00" value={weight} onChange={e=>setWeight(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 transition-all tabular-nums" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Value ({currencySymbol})</label>
                                <input type="number" step="0.01" required placeholder="0.00" value={packageValue} onChange={e=>setPackageValue(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all tabular-nums placeholder:text-indigo-200" />
                            </div>

                            <div className="col-span-2 space-y-4">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Mode & Payment</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setPaymentMode('PREPAID')}
                                        className={cn(
                                            "flex items-center gap-3 h-16 px-6 rounded-2xl border-2 transition-all group",
                                            paymentMode === 'PREPAID' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        <CreditCard size={20} className={paymentMode === 'PREPAID' ? "text-indigo-100" : "text-slate-200 group-hover:text-slate-400"} />
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Prepaid</p>
                                            <p className="text-[8px] font-medium opacity-70 uppercase tracking-tighter">Customer has paid client</p>
                                        </div>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setPaymentMode('COD')}
                                        className={cn(
                                            "flex items-center gap-3 h-16 px-6 rounded-2xl border-2 transition-all group",
                                            paymentMode === 'COD' ? "bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-100" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        <Banknote size={20} className={paymentMode === 'COD' ? "text-amber-100" : "text-slate-200 group-hover:text-slate-400"} />
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 font-black">COD</p>
                                            <p className="text-[8px] font-medium opacity-70 uppercase tracking-tighter">Collect {currencySymbol}{ (Number(packageValue) + estimatedFee).toFixed(2) } on delivery</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button disabled={isProcessing} className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 disabled:opacity-50 mt-4 italic border-t border-white/10">
                            {isProcessing ? 'SYNCHRONIZING...' : 'Authorize Logistics Chain'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
                <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-[2rem] border-none shadow-3xl">
                    <div id="shipment-label" className="p-8 bg-white text-black font-sans min-h-[500px] flex flex-col">
                        {/* Label Header */}
                        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-1">Logistics Express</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Official Transit Document</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase mb-1">Priority</p>
                                <div className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest rounded-md">
                                    Standard Air
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">From (Merchant)</p>
                                    <p className="text-[11px] font-black uppercase leading-tight italic">Global Inventory Partner</p>
                                    <p className="text-[9px] font-bold text-slate-600">Merchant Node ID: {manager?.id?.slice(0, 8)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Shipping Agent</p>
                                    <p className="text-[10px] font-black uppercase">{manager?.name || 'Central Hub'}</p>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-slate-100 pl-8">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Ship To (Recipient)</p>
                                    <p className="text-lg font-black uppercase leading-none mb-1">{selectedShipment?.recipientName}</p>
                                    <p className="text-[11px] font-bold leading-tight mb-2">{selectedShipment?.recipientAddress}</p>
                                    <p className="text-sm font-black italic">{selectedShipment?.recipientPhone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 border-2 border-black rounded-3xl p-6 mb-6 flex flex-col items-center justify-center bg-slate-50/30">
                            <div className="w-full max-w-sm mb-4">
                                <BarcodeGenerator 
                                    value={selectedShipment?.trackingNumber || ""} 
                                    width={2.5}
                                    height={100}
                                    fontSize={16}
                                />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Tracking identifier</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="p-4 border-2 border-slate-100 rounded-2xl flex flex-col justify-center">
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Weight</p>
                                <p className="text-xl font-black tabular-nums">{selectedShipment?.weight} KG</p>
                            </div>
                            <div className="p-4 border-2 border-slate-100 rounded-2xl flex flex-col justify-center">
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Date</p>
                                <p className="text-[11px] font-black uppercase">{new Date(selectedShipment?.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl flex flex-col justify-center border-2",
                                selectedShipment?.hasCod ? "border-amber-600 bg-amber-50" : "border-emerald-600 bg-emerald-50"
                            )}>
                                <p className={cn(
                                    "text-[8px] font-black uppercase tracking-widest mb-1",
                                    selectedShipment?.hasCod ? "text-amber-700" : "text-emerald-700"
                                )}>Status</p>
                                <p className={cn(
                                    "text-sm font-black italic uppercase",
                                    selectedShipment?.hasCod ? "text-amber-900" : "text-emerald-900"
                                )}>{selectedShipment?.hasCod ? 'COLLECT COD' : 'PREPAID'}</p>
                            </div>
                        </div>

                        {selectedShipment?.hasCod && (
                            <div className="p-6 bg-black text-white rounded-2xl flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Collect on Delivery</p>
                                    <p className="text-xs font-bold opacity-70">Total amount to be received by courier</p>
                                </div>
                                <p className="text-4xl font-black italic tabular-nums">{currencySymbol}{Number(selectedShipment?.codAmount).toFixed(2)}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center opacity-50">
                            <p className="text-[8px] font-bold uppercase tracking-widest italic">Electronic Logistics System v2.0</p>
                            <p className="text-[8px] font-bold uppercase tabular-nums">Ref: {selectedShipment?.id?.slice(0, 12)}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-950 flex items-center justify-between border-t border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ready for local print spooler</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsPrintOpen(false)} className="h-12 px-6 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 rounded-xl transition-all">Cancel</button>
                            <button 
                                onClick={() => {
                                    const printContent = document.getElementById('shipment-label');
                                    const windowUrl = 'about:blank';
                                    const uniqueName = new Date().getTime();
                                    const printWindow = window.open(windowUrl, uniqueName.toString(), 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
                                    
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Print Label - ${selectedShipment?.trackingNumber}</title>
                                                    <script src="https://cdn.tailwindcss.com"></script>
                                                    <style>
                                                        @media print {
                                                            body { margin: 0; padding: 0; }
                                                            #label { width: 100%; max-width: 100%; border: none; }
                                                        }
                                                        body { font-family: sans-serif; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div id="label">
                                                        ${printContent?.innerHTML}
                                                    </div>
                                                    <script>
                                                        setTimeout(() => {
                                                            window.print();
                                                            window.close();
                                                        }, 500);
                                                    </script>
                                                </body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                    }
                                }}
                                className="h-12 px-10 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2"
                            >
                                <Printer size={16} /> Print Now
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
