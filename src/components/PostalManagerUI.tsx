'use client';

import React, { useState } from 'react';
import { Truck, Search, Navigation, MapPin, Package, ArrowUpRight, ArrowDownLeft, History, BellRing, Send, CheckCircle2, PackageCheck, Wallet, Landmark, HandCoins } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { updateShipmentStatus, createClientAccount } from '@/app/actions/postalOps';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PostalManagerUIProps {
    initialClients: any[];
    initialShipments: any[];
    currencySymbol?: string;
    economics?: {
        netProfit: number;
        merchantDebt: number;
    };
}

export default function PostalManagerUI({ 
    initialClients, 
    initialShipments, 
    currencySymbol = '$', 
    economics = { netProfit: 0, merchantDebt: 0 } 
}: PostalManagerUIProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [clients, setClients] = useState(initialClients);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'OUTGOING' | 'INCOMING' | 'HISTORY'>('OUTGOING');

    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientPassword, setNewClientPassword] = useState('');

    const handleUpdateStatus = async (id: string, status: string) => {
        setIsProcessing(true);
        const res = await updateShipmentStatus(id, status);
        setIsProcessing(false);
        if (res.success) {
            toast.success(`Shipment updated to ${status.replace(/_/g, ' ')}`);
            setShipments(shipments.map(s => s.id === id ? { ...s, status } : s));
        } else {
            toast.error(res.error);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const res = await createClientAccount({ name: newClientName, email: newClientEmail, password: newClientPassword });
        setIsProcessing(false);
        if (res.success) {
            toast.success('Client registered securely');
            setClients([...clients, res.client]);
            setIsCreateClientOpen(false);
            setNewClientName('');
            setNewClientEmail('');
            setNewClientPassword('');
        } else {
            toast.error(res.error);
        }
    };

    const outgoing = shipments.filter(s => s.originManagerId === initialShipments[0]?.originManagerId && s.status !== 'DELIVERED' && s.status !== 'CANCELLED');
    const incoming = shipments.filter(s => s.destinationManagerId === initialShipments[0]?.originManagerId && s.status !== 'DELIVERED' && s.status !== 'CANCELLED');
    const history = shipments.filter(s => s.status === 'DELIVERED' || s.status === 'CANCELLED');

    const getCurrentList = () => {
        const base = activeTab === 'OUTGOING' ? outgoing : activeTab === 'INCOMING' ? incoming : history;
        return base.filter(s => 
            s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filtered = getCurrentList();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Identity Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 shadow-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5">
                <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center text-white shadow-2xl border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-all" onClick={() => signOut()}>
                        <Truck size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase italic underline decoration-indigo-500 decoration-8 underline-offset-4">Hub Ops</h1>
                        <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                             <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-4 border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.5)]"/>
                             Logged into regional node
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-center min-w-[170px] group hover:bg-emerald-500/20 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <Landmark size={14} className="text-emerald-400" />
                            <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest leading-none">Node Profit</p>
                        </div>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{currencySymbol}{economics.netProfit.toFixed(2)}</p>
                    </div>
                    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-center min-w-[170px] group hover:bg-amber-500/20 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <HandCoins size={14} className="text-amber-400" />
                            <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest leading-none">Owed to Clients</p>
                        </div>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{currencySymbol}{economics.merchantDebt.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        {(['OUTGOING', 'INCOMING', 'HISTORY'] as const).map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)} 
                                className={cn(
                                    "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2", 
                                    activeTab === tab ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {tab === 'OUTGOING' && <ArrowUpRight size={14} />}
                                {tab === 'INCOMING' && <ArrowDownLeft size={14} />}
                                {tab === 'HISTORY' && <History size={14} />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => setIsCreateClientOpen(true)} className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ml-2">
                        Onboard Partner
                    </button>
                </div>

                <div className="relative group w-full lg:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input 
                        type="text"
                        placeholder="Filter Operational Registry..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none text-slate-800"
                    />
                </div>
            </div>

            {/* Main Operational Ledger */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent h-14">
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] px-8 italic">Manifest ID</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Chain Link</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Fiscal Status</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-right px-8 italic">Command</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(s => (
                            <TableRow key={s.id} className="group hover:bg-slate-50 border-slate-50 h-24 transition-colors">
                                <TableCell className="px-8">
                                    <div className="font-black text-base text-slate-900 font-mono tracking-tighter mb-1 select-all">{s.trackingNumber}</div>
                                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest opacity-60 flex items-center gap-2 italic">
                                        <Wallet size={12} /> {s.sender?.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <MapPin size={18} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <div className="font-black text-xs text-slate-900 uppercase mb-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">{s.recipientName}</div>
                                            <div className="text-[10px] text-slate-400 font-medium max-w-[200px] truncate tracking-tight">{s.recipientAddress}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit border-none shadow-sm",
                                            s.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                            s.status === 'COLLECTED' ? "bg-blue-600 text-white" : 
                                            s.status.includes('IN_TRANSIT') ? "bg-indigo-900 text-indigo-100" : 
                                            s.status === 'DELIVERED' ? "bg-emerald-500 text-white shadow-emerald-200" : 
                                            "bg-slate-100 text-slate-500"
                                        )}>{s.status.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black text-slate-900 tabular-nums italic">{currencySymbol}{Number(s.shippingFee).toFixed(2)}</span>
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter italic">Fee</span>
                                            </div>
                                            {s.hasCod && (
                                                <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                    <span className="text-[10px] font-black text-amber-600 tabular-nums italic">{currencySymbol}{Number(s.codAmount).toFixed(2)}</span>
                                                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-tighter italic">Collect</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right px-8">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        {s.status === 'PENDING' && (
                                            <Button 
                                                size="sm" 
                                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all gap-2"
                                                onClick={() => handleUpdateStatus(s.id, 'COLLECTED')}
                                            >
                                                <Package size={16} /> Intake
                                            </Button>
                                        )}
                                        {s.status === 'COLLECTED' && (
                                            <Button 
                                                size="sm" 
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all gap-2"
                                                onClick={() => handleUpdateStatus(s.id, 'PENDING_PICKUP')}
                                            >
                                                <Navigation size={16} /> Relay
                                            </Button>
                                        )}
                                        {s.status === 'IN_TRANSIT_TO_DESTINATION' && (
                                            <Button 
                                                size="sm" 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                                                onClick={() => handleUpdateStatus(s.id, 'ARRIVED_AT_HUB')}
                                            >
                                                <CheckCircle2 size={16} /> Arrival
                                            </Button>
                                        )}
                                        {s.status === 'ARRIVED_AT_HUB' && (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="border-slate-200 h-10 px-4 rounded-xl font-bold" onClick={() => toast.success('SMS Sent')}>
                                                    <Send size={14} />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100"
                                                    onClick={() => handleUpdateStatus(s.id, 'DELIVERED')}
                                                >
                                                    Fulfill
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
                <DialogContent className="bg-white rounded-[3rem] border-slate-100 shadow-3xl p-8 max-w-md overflow-hidden">
                    <div className="bg-slate-900 p-10 -m-8 mb-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Truck size={100} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-2 underline decoration-indigo-500 decoration-8 underline-offset-4">Partner Onboarding</DialogTitle>
                            <DialogDescription className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] font-mono whitespace-nowrap">Secure Client Network Associate</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleCreateClient} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Merchant Identity</label>
                            <input required type="text" value={newClientName} onChange={e=>setNewClientName(e.target.value)} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none" placeholder="Company Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Network Email</label>
                            <input required type="email" value={newClientEmail} onChange={e=>setNewClientEmail(e.target.value)} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none font-mono" placeholder="contact@merchant.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Access Key</label>
                            <input required type="password" value={newClientPassword} onChange={e=>setNewClientPassword(e.target.value)} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none font-mono" placeholder="••••••••" />
                        </div>
                        <button disabled={isProcessing} className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 italic">
                            {isProcessing ? 'AUTHORIZING...' : 'Verify & Grant Access'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
