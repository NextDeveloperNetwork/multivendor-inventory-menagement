'use client';

import React, { useState } from 'react';
import { Package, Search, Navigation, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { assignDestinationManager } from '@/app/actions/postalAdminOps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PostalSortingClientProps {
    initialShipments: any[];
    managers: any[];
}

export default function PostalSortingClient({ initialShipments, managers }: PostalSortingClientProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedManagerMap, setSelectedManagerMap] = useState<Record<string, string>>({});

    const handleAssign = async (shipmentId: string) => {
        const managerId = selectedManagerMap[shipmentId];
        if (!managerId) return toast.error('Select a destination manager first.');
        
        setIsProcessing(true);
        const res = await assignDestinationManager(shipmentId, managerId);
        setIsProcessing(false);
        
        if (res.success) {
            toast.success('Shipment routed to destination node');
            setShipments(shipments.filter(s => s.id !== shipmentId));
        } else {
            toast.error(res.error);
        }
    };

    const filtered = shipments.filter(s => 
        s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.recipientAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Identity Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-black shadow-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-xl" />
                
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-indigo-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg border border-indigo-500/30 shrink-0">
                        <Package size={26} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-1 uppercase">Central Sorting Hub</h1>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                             Total Packages in Queue: {shipments.length}
                        </p>
                    </div>
                </div>

                <div className="relative group w-full lg:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                    <input 
                        type="text"
                        placeholder="Search queue..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 h-10 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500/50 transition-all outline-none text-white"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider">Arrival Info</TableHead>
                                <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider">Final Address</TableHead>
                                <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider">Weight / Notes</TableHead>
                                <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider text-right">Route Destination</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest">Queue Clear</TableCell></TableRow>
                            ) : filtered.map(s => (
                                <TableRow key={s.id} className="group hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="font-black text-sm text-slate-900 font-mono tracking-tight">{s.trackingNumber}</div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                            From: <span className="text-indigo-600">{s.originManager?.name || 'Local Drop'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-2">
                                            <MapPin size={14} className="text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="font-bold text-xs text-slate-900 uppercase">{s.recipientName}</div>
                                                <div className="text-[10px] text-slate-500 leading-tight">{s.recipientAddress}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{s.weight} KG</div>
                                        <div className="text-[9px] text-slate-400 mt-1 italic line-clamp-1">{s.notes || 'No instructions'}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <select 
                                                value={selectedManagerMap[s.id] || ''} 
                                                onChange={e => setSelectedManagerMap({...selectedManagerMap, [s.id]: e.target.value})}
                                                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wide outline-none focus:border-indigo-400 transition-all min-w-[200px]"
                                            >
                                                <option value="">-- Choose Destination --</option>
                                                {managers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={() => handleAssign(s.id)}
                                                disabled={isProcessing || !selectedManagerMap[s.id]}
                                                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <Navigation size={12} /> Route
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
