'use client';

import React, { useState } from 'react';
import { Truck, Search, Navigation, MapPin, Package, ArrowUpRight, ArrowDownLeft, History, BellRing, Send, CheckCircle2, PackageCheck, Wallet, Landmark, HandCoins } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { updateShipmentStatus, createClientAccount, getTransporters, assignShipmentsToTransporter } from '@/app/actions/postalOps';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PostalManagerUIProps {
    initialClients: any[];
    initialShipments: any[];
    pendingSettlements?: any[];
    currencySymbol?: string;
    economics?: {
        netProfit: number;
        merchantDebt: number;
    };
}

export default function PostalManagerUI({ 
    initialClients, 
    initialShipments, 
    pendingSettlements = [],
    currencySymbol = '$', 
    economics = { netProfit: 0, merchantDebt: 0 } 
}: PostalManagerUIProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [clients, setClients] = useState(initialClients);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'OUTGOING' | 'INCOMING' | 'HISTORY' | 'ACCOUNTS'>('OUTGOING');

    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const [isRelayOpen, setIsRelayOpen] = useState(false);
    const [transporters, setTransporters] = useState<any[]>([]);
    const [selectedTransporterId, setSelectedTransporterId] = useState<string>('');
    const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
    
    const [newClientName, setNewClientName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientPassword, setNewClientPassword] = useState('');

    React.useEffect(() => {
        getTransporters().then(res => {
            if (res.success) setTransporters(res.transporters);
        });
    }, []);

    const toggleSelection = (id: string) => {
        setSelectedShipments(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleRelay = async () => {
        if (!selectedTransporterId) {
            toast.error('Select a transporter first');
            return;
        }
        setIsProcessing(true);
        const res = await assignShipmentsToTransporter(selectedShipments, selectedTransporterId);
        setIsProcessing(false);
        if (res.success) {
            toast.success(`Relayed ${selectedShipments.length} packages`);
            setShipments(shipments.map(s => 
                selectedShipments.includes(s.id) 
                ? { ...s, status: 'ASSIGNED_FOR_PICKUP', transporterId: selectedTransporterId } 
                : s
            ));
            setSelectedShipments([]);
            setIsRelayOpen(false);
        } else {
            toast.error(res.error);
        }
    };

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

    const handleFulfill = async (id: string) => {
        setIsProcessing(true);
        const { finalizeManagerDelivery } = await import('@/app/actions/postalOps');
        const res = await finalizeManagerDelivery(id);
        setIsProcessing(false);
        if (res.success) {
            toast.success('Package Delivered to Customer');
            setShipments(shipments.map(s => s.id === id ? { ...s, status: 'DELIVERED', paymentStatus: 'UNPAID' } : s));
        } else {
            toast.error(res.error);
        }
    };

    const handleSettle = async (shipmentId: string, fromId: string, toId: string, amount: number) => {
        setIsProcessing(true);
        const { createSettlement } = await import('@/app/actions/postalOps');
        const res = await createSettlement(shipmentId, fromId, toId, amount);
        setIsProcessing(false);
        if (res.success) {
            toast.success('Settlement payment sent to client. Awaiting acceptance.');
            setShipments(shipments.map(s => s.id === shipmentId ? { ...s, paymentStatus: 'PENDING_ACCEPTANCE' } : s));
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
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                        {(['OUTGOING', 'INCOMING', 'HISTORY', 'ACCOUNTS'] as const).map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)} 
                                className={cn(
                                    "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", 
                                    activeTab === tab ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {tab === 'OUTGOING' && <ArrowUpRight size={14} />}
                                {tab === 'INCOMING' && <ArrowDownLeft size={14} />}
                                {tab === 'HISTORY' && <History size={14} />}
                                {tab === 'ACCOUNTS' && <Wallet size={14} />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => setIsCreateClientOpen(true)} className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ml-2">
                        Onboard Partner
                    </button>

                    {selectedShipments.length > 0 && (
                        <button 
                            onClick={() => setIsRelayOpen(true)}
                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 animate-in zoom-in duration-300 flex items-center gap-2"
                        >
                            <Send size={16} /> Relay {selectedShipments.length} Items
                        </button>
                    )}
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
                            <TableHead className="w-12 px-8">
                                <Checkbox 
                                    checked={selectedShipments.length === filtered.length && filtered.length > 0}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedShipments(filtered.map(s => s.id));
                                        else setSelectedShipments([]);
                                    }}
                                />
                            </TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Manifest ID</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Chain Link</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Fiscal Status</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-right px-8 italic">Command</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(s => (
                            <TableRow key={s.id} className={cn("group hover:bg-slate-50 border-slate-50 h-24 transition-colors", selectedShipments.includes(s.id) && "bg-indigo-50/50 hover:bg-indigo-50")}>
                                <TableCell className="px-8">
                                    <Checkbox 
                                        checked={selectedShipments.includes(s.id)}
                                        onCheckedChange={() => toggleSelection(s.id)}
                                    />
                                </TableCell>
                                <TableCell>
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
                                                    onClick={() => handleFulfill(s.id)}
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
                
                {activeTab === 'ACCOUNTS' && (
                    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Merchant Debt Ledger */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic flex items-center gap-2">
                                    <Landmark size={16} /> Partner Debt Ledger
                                </h3>
                                <div className="space-y-3">
                                    {clients.map(client => (
                                        <div key={client.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl uppercase italic">
                                                    {client.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{client.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{client.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Owed COD</p>
                                                <p className="text-2xl font-black text-indigo-600 tabular-nums italic tracking-tighter leading-none">{currencySymbol}{client.outstandingCod?.toFixed(2) || '0.00'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Settlement Reconciliation queue */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic flex items-center gap-2">
                                    <History size={16} /> Pending COD Payouts
                                </h3>
                                <div className="space-y-3">
                                    {shipments.filter(s => s.status === 'DELIVERED' && s.hasCod && s.paymentStatus === 'UNPAID').map(s => (
                                        <div key={s.id} className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">PKG: {s.trackingNumber}</p>
                                                <p className="text-xs font-black text-slate-800 uppercase italic leading-none">{s.sender?.name}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1 italic">Settlement amount</p>
                                                    <p className="text-xl font-black text-slate-900 tabular-nums italic tracking-tighter leading-none">{currencySymbol}{(s.codAmount - s.shippingFee).toFixed(2)}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleSettle(s.id, s.destinationManagerId, s.senderId, s.codAmount - s.shippingFee)}
                                                    className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                                >
                                                    Settle
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {shipments.filter(s => s.status === 'DELIVERED' && s.hasCod && s.paymentStatus === 'UNPAID').length === 0 && (
                                        <div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No Pending Payouts</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
            <Dialog open={isRelayOpen} onOpenChange={setIsRelayOpen}>
                <DialogContent className="bg-white rounded-[2.5rem] p-8 max-w-md overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">Relay Assignment</DialogTitle>
                        <DialogDescription className="text-slate-400 font-black uppercase text-[9px] tracking-widest italic pt-2">Transfering {selectedShipments.length} manifests to fleet transporter</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6 border-y border-slate-50 my-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic ml-1 text-center block">Select Active Transporter</label>
                            <Select onValueChange={setSelectedTransporterId}>
                                <SelectTrigger className="h-16 bg-slate-50 border-slate-100 rounded-[1.5rem] font-bold text-slate-900">
                                    <SelectValue placeholder="Chose Unit..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-2xl border-slate-100 shadow-2xl">
                                    {transporters.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="font-bold py-3 hover:bg-indigo-50 text-slate-800">
                                            {t.name} ({t.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 italic"
                            onClick={handleRelay}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'COMMITTING...' : 'Commit Relay Hub'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
