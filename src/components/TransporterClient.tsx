'use client';

import { useState } from 'react';
import { 
    Truck, 
    Navigation, 
    CheckCircle2, 
    History, 
    ArrowRight, 
    Package, 
    User, 
    Clock,
    LogOut
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { updateTransportStatus } from '@/app/actions/transportation';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface TransporterClientProps {
    transfers: any[];
}

export default function TransporterClient({ transfers }: TransporterClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const activeTransfers = transfers.filter(t => t.status !== 'DELIVERED');
    const pastTransfers = transfers.filter(t => t.status === 'DELIVERED');

    const handleStatusUpdate = async (id: string, newStatus: 'SHIPPED' | 'DELIVERED') => {
        setLoading(id);
        const res = await updateTransportStatus(id, newStatus);
        if (res.success) {
            toast.success(`Unit update verified: ${newStatus}`);
            router.refresh();
        } else {
            toast.error(res.error || "Registry update failed");
        }
        setLoading(null);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col p-6 md:p-12 overflow-hidden gap-12">
            {/* Header / HUD */}
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                            FLEET <span className="text-indigo-400 font-black">LOGS</span>
                        </h1>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                             System Active • Synchronized Operations Control
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic mb-1">Status Report</span>
                        <span className="text-xl font-black tabular-nums italic">{activeTransfers.length} ACTIVE_MANIFESTS</span>
                    </div>
                    <button 
                        onClick={() => signOut()}
                        className="w-14 h-14 bg-white/10 hover:bg-rose-600 rounded-2xl flex items-center justify-center border border-white/10 hover:border-rose-400 transition-all group/out"
                    >
                        <LogOut size={24} className="group-hover/out:translate-x-1 group-active/out:scale-95 transition-all" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
                {/* Active Assignments */}
                <div className="space-y-8 flex flex-col h-full">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                            <Navigation size={20} className="animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Primary <span className="text-indigo-400">Routes</span></h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                        {activeTransfers.length === 0 ? (
                            <div className="p-16 text-center bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                                <Package size={48} className="mx-auto text-white/10 mb-6" />
                                <p className="text-xs font-black text-white/30 uppercase tracking-[0.3em] italic">No active manifests assigned</p>
                                <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-2">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
                            </div>
                        ) : (
                            activeTransfers.map((t) => (
                                <div key={t.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all group relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border font-mono italic ${
                                            t.status === 'SHIPPED' ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-white/60 border-white/5'
                                        }`}>
                                            {t.status}
                                        </div>
                                        <div className="text-[10px] font-black text-white/20 italic font-mono tracking-widest">
                                            #{t.id.slice(-10).toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6 mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-all group-hover:scale-110">
                                                <History size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic mb-1">Pickup Manifest Location</p>
                                                <p className="text-xl font-black italic tracking-tight truncate">{t.fromShop?.name || t.fromWarehouse?.name}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="ml-6 h-10 w-px bg-white/10 border-l border-dashed border-white/20 relative">
                                            <div className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-all group-hover:scale-110 shadow-lg">
                                                <Navigation size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic mb-1">Target Distribution Target</p>
                                                <p className="text-xl font-black italic tracking-tight truncate">{t.toShop?.name || t.toWarehouse?.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {t.status !== 'SHIPPED' ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(t.id, 'SHIPPED')}
                                                disabled={loading === t.id}
                                                className="col-span-2 h-16 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <Truck size={18} strokeWidth={3} />
                                                {loading === t.id ? 'SYNCING...' : 'INITIATE_SHIPMENT'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusUpdate(t.id, 'DELIVERED')}
                                                disabled={loading === t.id}
                                                className="col-span-2 h-16 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 border border-indigo-400 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <CheckCircle2 size={18} strokeWidth={3} />
                                                {loading === t.id ? 'SYNCING...' : 'VERIFY_DELIVERY_ARRIVAL'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Logistics History */}
                <div className="space-y-8 flex flex-col h-full lg:border-l lg:border-white/5 lg:pl-12">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                <History size={22} className="text-white/40" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Operation <span className="text-white/40">History</span></h2>
                        </div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-mono italic">{pastTransfers.length} ARCHIVES</div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                        {pastTransfers.length === 0 ? (
                            <div className="p-16 text-center opacity-20">
                                <p className="text-[9px] font-black uppercase tracking-widest italic leading-relaxed">System logs for past operations<br/>will appear here once synchronized</p>
                            </div>
                        ) : (
                            pastTransfers.slice(0, 10).map((t) => (
                                <div key={t.id} className="p-6 bg-white/2 rounded-2xl border border-white/2 hover:border-white/5 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black italic text-white/80 truncate">{t.fromShop?.name || t.fromWarehouse?.name}</span>
                                                <ArrowRight size={10} className="text-white/10" />
                                                <span className="text-xs font-black italic text-white/80 truncate">{t.toShop?.name || t.toWarehouse?.name}</span>
                                            </div>
                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1 italic">
                                                Verified Arrival: {formatDateTime(t.deliveredAt || t.updatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-mono font-black italic text-white/30 ml-4">
                                        #{t.id.slice(-8).toUpperCase()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 shrink-0">
                <div className="flex items-center gap-12">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1 italic">Fleet Node ID</span>
                        <span className="text-sm font-black italic tabular-nums tracking-widest">UNIT_77189_ALPHA_X</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1 italic">Auth Credentials</span>
                        <span className="text-sm font-black italic text-emerald-500 tracking-widest leading-none flex items-center gap-2">
                             SECURE_CONNECTION
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 group hover:bg-white/10 cursor-pointer transition-all">
                        <Clock size={16} className="text-indigo-400" />
                        <span className="text-sm font-black italic tabular-nums">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
