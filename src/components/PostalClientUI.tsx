'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, MapPin, Navigation, Printer, ArrowRight, QrCode, CreditCard, Banknote, Info, TrendingUp, Truck, CheckCircle2, Clock, Scale, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClientShipment } from '@/app/actions/postalOps';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarcodeGenerator } from './barcode/components/BarcodeGenerator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PostalClientUIProps {
    initialShipments: any[];
    settlements?: any[];
    totalOutstanding?: number;
    manager: any | null;
    currencySymbol?: string;
}

const StatsCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 flex items-center justify-between shadow-2xl group hover:bg-white/10 hover:border-white/20 transition-all duration-500">
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{value}</p>
                {subValue && <span className="text-[10px] font-bold text-indigo-400 uppercase italic opacity-80">{subValue}</span>}
            </div>
        </div>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 shadow-lg", color)}>
            <Icon size={24} strokeWidth={1.5} />
        </div>
    </div>
);

export default function PostalClientUI({ 
    initialShipments, 
    settlements: initialSettlements = [], 
    totalOutstanding = 0,
    manager, 
    currencySymbol = '$' 
}: PostalClientUIProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [settlements, setSettlements] = useState(initialSettlements);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [activeTab, setActiveTab ] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'ACCOUNTS'>('ALL');
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
        totalOwed: shipments
            .filter(s => s.status === 'DELIVERED' && s.hasCod)
            .reduce((acc, s) => acc + (Number(s.codAmount) - Number(s.shippingFee)), 0),
        totalFees: shipments.reduce((acc, s) => acc + Number(s.shippingFee || 0), 0),
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

    const handleAcceptSettlement = async (settlementId: string) => {
        setIsProcessing(true);
        const { acceptSettlement } = await import('@/app/actions/postalOps');
        const res = await acceptSettlement(settlementId);
        setIsProcessing(false);
        if (res.success) {
            toast.success('Funds Accepted and Closed');
            setSettlements(settlements.map(s => s.id === settlementId ? { ...s, status: 'ACCEPTED' } : s));
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
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 -m-4 md:-m-8 space-y-6 animate-in fade-in duration-500">
            {/* Identity Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl opacity-50" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl opacity-30" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                        <Package size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Logistics Center</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] text-blue-100 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20"/>
                                {manager?.name || 'Central Hub'}
                            </p>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <p className="text-[10px] text-indigo-100/60 font-black uppercase tracking-widest italic">Operations Portal</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                        <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest mb-1.5 opacity-80 leading-none">Manifests</p>
                        <p className="text-xl font-black text-white tabular-nums tracking-tighter leading-none">{shipments.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                        <p className="text-[9px] text-amber-200 font-black uppercase tracking-widest mb-1.5 opacity-80 leading-none">In Transit</p>
                        <p className="text-xl font-black text-white tabular-nums tracking-tighter leading-none">{stats.inTransit}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                        <p className="text-[9px] text-emerald-200 font-black uppercase tracking-widest mb-1.5 opacity-80 leading-none">Delivered</p>
                        <p className="text-xl font-black text-white tabular-nums tracking-tighter leading-none">{stats.delivered}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] group">
                        <p className="text-[9px] text-emerald-200 font-black uppercase tracking-widest mb-1.5 leading-none italic">Outstanding</p>
                        <p className="text-xl font-black text-white tabular-nums tracking-tighter leading-none group-hover:scale-110 transition-transform">{currencySymbol}{totalOutstanding.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[110px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                        <p className="text-[9px] text-indigo-200 font-black uppercase tracking-widest mb-1.5 leading-none italic">Revenue</p>
                        <p className="text-xl font-black text-white/80 tabular-nums tracking-tighter leading-none">{currencySymbol}{stats.totalOwed.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                    {(['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'ACCOUNTS'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "h-9 px-5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-nowrap",
                                activeTab === tab 
                                    ? "bg-indigo-600 text-white shadow-md" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Search active records..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold tracking-wider placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all outline-none text-slate-800"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-3 shrink-0"
                    >
                        <Plus size={16} strokeWidth={3} /> Submit Dispatch
                    </button>
                    <button onClick={() => signOut()} className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                        <User size={18} />
                    </button>
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 h-14">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Tracking & Method</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Identity / Route</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-right">Due to Me</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-right">Service Fee</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((s) => (
                            <TableRow key={s.id} className="group hover:bg-slate-50/50 border-slate-100 transition-colors">
                                <TableCell className="py-5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{new Date(s.createdAt).toLocaleDateString()}</p>
                                    <p className="text-[9px] font-medium text-slate-300 uppercase italic mt-1">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <Package size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 tracking-tight uppercase leading-none mb-1">{s.trackingNumber}</p>
                                            <Badge variant="outline" className={cn(
                                                "h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter border-0",
                                                s.hasCod ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {s.hasCod ? 'Collect COD' : 'Prepaid Item'}
                                            </Badge>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-none mb-1 italic">{s.recipientName}</p>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <MapPin size={10} />
                                        <p className="text-[9px] font-medium uppercase truncate max-w-[150px]">{s.recipientAddress}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                s.status === 'DELIVERED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                                                s.status?.includes('TRANSIT') ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" :
                                                "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                            )} />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{s.status?.replace(/_/g, ' ') || 'Pending Pickup'}</span>
                                        </div>
                                        {s.status === 'DELIVERED' && s.hasCod && (
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit",
                                                s.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                                                s.paymentStatus === 'PENDING_ACCEPTANCE' ? "bg-amber-100 text-amber-700 animate-pulse" :
                                                "bg-slate-100 text-slate-500"
                                            )}>
                                                {s.paymentStatus || 'UNPAID'}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <p className="text-sm font-black text-slate-900 tabular-nums italic tracking-tighter">
                                            {s.hasCod ? (Number(s.codAmount) - Number(s.shippingFee)).toFixed(2) : '-'}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-1">Merchant Share</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <p className="text-sm font-bold text-slate-400 tabular-nums tracking-tighter">
                                        {currencySymbol}{Number(s.shippingFee).toFixed(2)}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <button 
                                        onClick={() => handlePrint(s)}
                                        className="h-8 w-8 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 ml-auto"
                                    >
                                        <Printer size={14} />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search size={32} className="text-slate-200 mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching operations recorded</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {activeTab === 'ACCOUNTS' && (
                <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic mb-6 flex items-center gap-3">
                            <DollarSign size={18} /> Financial Settlements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {settlements.map(st => (
                                <div key={st.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between group hover:border-indigo-200 transition-all">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none px-3", st.status === 'ACCEPTED' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white shadow-lg shadow-amber-100")}>
                                                {st.status}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic">Ref: {st.id.slice(0, 8)}</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Income from Shipment</p>
                                            <p className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{st.shipment?.trackingNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                                <Banknote size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Settlement</p>
                                                <p className="text-2xl font-black text-slate-900 tabular-nums italic tracking-tighter leading-none">{currencySymbol}{st.amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {st.status === 'PENDING' && (
                                        <button 
                                            onClick={() => handleAcceptSettlement(st.id)}
                                            className="w-full h-14 bg-slate-900 hover:bg-emerald-600 text-white rounded-[1.5rem] mt-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all italic flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle2 size={18} /> Accept Funds
                                        </button>
                                    )}
                                    {st.status === 'ACCEPTED' && (
                                        <div className="w-full h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[1.5rem] mt-6 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 italic">
                                            <Clock size={18} /> Funds Disbursed
                                        </div>
                                    )}
                                </div>
                            ))}
                            {settlements.length === 0 && (
                                <div className="col-span-full py-24 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">No settlement documents found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-white rounded-[1.5rem] border-slate-200 shadow-3xl p-8 max-w-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                    
                    <DialogHeader className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase text-slate-900 tracking-tighter">New Dispatch</DialogTitle>
                                <DialogDescription className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400 flex items-center gap-2">
                                    Initialize Regional Transit Operation
                                </DialogDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Est. Fee</p>
                                <p className="text-2xl font-black text-blue-600 tabular-nums italic tracking-tighter">{currencySymbol}{estimatedFee.toFixed(2)}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Recipient Identity</label>
                                <input required placeholder="Full Name" value={recipientName} onChange={e=>setRecipientName(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-300" />
                            </div>
                            <div className="space-y-1.5 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Phone</label>
                                <input required placeholder="+00..." value={recipientPhone} onChange={e=>setRecipientPhone(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 transition-all font-mono placeholder:text-slate-300" />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Transit Address</label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input required placeholder="Enter Address" value={recipientAddress} onChange={e=>setRecipientAddress(e.target.value)} className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-300" />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 col-span-2 my-1" />

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1 italic">Weight (KG)</label>
                                <input type="number" step="0.1" required placeholder="0.00" value={weight} onChange={e=>setWeight(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-400 transition-all tabular-nums" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1 italic">Value ({currencySymbol})</label>
                                <input type="number" step="0.01" required placeholder="0.00" value={packageValue} onChange={e=>setPackageValue(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-blue-600 outline-none focus:border-blue-400 transition-all tabular-nums" />
                            </div>

                            <div className="col-span-2 space-y-3">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Service & Payment</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setPaymentMode('PREPAID')}
                                        className={cn(
                                            "flex items-center gap-3 h-14 px-4 rounded-xl border-2 transition-all",
                                            paymentMode === 'PREPAID' ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                                        )}
                                    >
                                        <CreditCard size={18} />
                                        <div className="text-left">
                                            <p className="text-[9px] font-bold uppercase leading-none mb-1">Prepaid</p>
                                            <p className="text-[7px] font-medium opacity-70 uppercase tracking-tighter">Paid Online</p>
                                        </div>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setPaymentMode('COD')}
                                        className={cn(
                                            "flex items-center gap-3 h-14 px-4 rounded-xl border-2 transition-all",
                                            paymentMode === 'COD' ? "bg-amber-600 border-amber-600 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                                        )}
                                    >
                                        <Banknote size={18} />
                                        <div className="text-left">
                                            <p className="text-[9px] font-bold uppercase leading-none mb-1">COD</p>
                                            <p className="text-[7px] font-medium opacity-70 uppercase tracking-tighter">Pay on Delivery</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button disabled={isProcessing} className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-2">
                            {isProcessing ? 'Processing...' : 'Submit Operation'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
                <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-[2rem] border-none shadow-3xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Shipment Print Manifest</DialogTitle>
                        <DialogDescription>Print-ready logistic tracking label with barcode</DialogDescription>
                    </DialogHeader>
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
