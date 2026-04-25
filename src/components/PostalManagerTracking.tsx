'use client';

import { useState } from 'react';
import { 
    Package, 
    Search, 
    Filter, 
    Truck, 
    MapPin, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    ArrowRightLeft,
    MoreHorizontal,
    ExternalLink
} from 'lucide-react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PostalManagerTrackingProps {
    initialShipments: any[];
}

const statusColors: any = {
    'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
    'COLLECTED': 'bg-blue-100 text-blue-700 border-blue-200',
    'PENDING_PICKUP': 'bg-orange-100 text-orange-700 border-orange-200',
    'IN_TRANSIT_TO_SORTING': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'AT_SORTING_CENTER': 'bg-purple-100 text-purple-700 border-purple-200',
    'IN_TRANSIT_TO_DESTINATION': 'bg-sky-100 text-sky-700 border-sky-200',
    'ARRIVED_AT_HUB': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'DELIVERED': 'bg-green-100 text-green-700 border-green-200',
};

export default function PostalManagerTracking({ initialShipments }: PostalManagerTrackingProps) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'INBOUND' | 'PROCESSING' | 'OUTBOUND'>('ALL');

    const filtered = initialShipments.filter(s => {
        const matchesSearch = s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
                            s.recipientName.toLowerCase().includes(search.toLowerCase());
        
        if (filter === 'ALL') return matchesSearch;
        // Inbound = coming from sorting or other hubs
        // Processing = at this hub
        // Outbound = collected and waiting for pickup or in transit to sorting
        return matchesSearch;
    });

    const stats = {
        total: initialShipments.length,
        inTransit: initialShipments.filter(s => s.status.includes('TRANSIT')).length,
        deliveredToday: initialShipments.filter(s => s.status === 'DELIVERED').length, // Should filter by date
        pending: initialShipments.filter(s => s.status === 'PENDING').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <ArrowRightLeft size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Network Logistics</h1>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <Clock size={14} className="text-indigo-500" />
                                Real-time regional fulfillment monitoring
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                        {(['ALL', 'INBOUND', 'PROCESSING', 'OUTBOUND'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                                    filter === f 
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Network Load', value: stats.total, icon: Package, color: 'indigo' },
                    { label: 'Active Transit', value: stats.inTransit, icon: Truck, color: 'blue' },
                    { label: 'Waitlist', value: stats.pending, icon: Clock, color: 'amber' },
                    { label: 'Completed', value: stats.deliveredToday, icon: CheckCircle2, color: 'emerald' },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-xl shadow-slate-100/50 bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1 group-hover:text-indigo-500 transition-colors">
                                        {stat.label}
                                    </p>
                                    <h3 className="text-2xl font-black text-slate-900 group-hover:scale-105 transition-transform origin-left">
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12",
                                    stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600 shadow-indigo-100" :
                                    stat.color === 'blue' ? "bg-blue-50 text-blue-600 shadow-blue-100" :
                                    stat.color === 'amber' ? "bg-amber-50 text-amber-600 shadow-amber-100" :
                                    "bg-emerald-50 text-emerald-600 shadow-emerald-100"
                                )}>
                                    <stat.icon size={22} strokeWidth={2.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tracking Table */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2rem]">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input 
                                placeholder="Search tracking ID or recipient..." 
                                className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400 text-sm font-medium transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold text-slate-600 hover:bg-slate-50 gap-2 border-slate-200">
                            <Filter size={18} /> Export Data
                        </Button>
                    </div>

                    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 h-14">Identity</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 h-14">Recipient / Node</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 h-14">Logistics Status</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 h-14">Financial Check</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 h-14 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 mb-0.5 tracking-tight">{s.trackingNumber}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(s.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 mb-1">{s.recipientName}</p>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <MapPin size={12} className="text-rose-500/70" />
                                                    <p className="text-[11px] font-medium truncate max-w-[200px]">{s.recipientAddress}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-none shadow-sm",
                                                statusColors[s.status] || 'bg-slate-100 text-slate-700'
                                            )}>
                                                {s.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {s.hasCod ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-600 bg-amber-50">COD</Badge>
                                                        <span className="text-xs font-bold text-slate-700">${s.codAmount}</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-600 bg-emerald-50">PREPAID</Badge>
                                                )}
                                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Fee: ${s.shippingFee}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100">
                                                    <ExternalLink size={16} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium">
                            Showing <span className="text-slate-900 font-bold">{filtered.length}</span> active network entries
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-[11px] font-bold h-9">Previous</Button>
                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-[11px] font-bold h-9">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
