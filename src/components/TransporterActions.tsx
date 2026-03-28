'use client';

import { useState } from 'react';
import { updateTransportStatus } from '@/app/actions/transport-flow';
import { 
    Truck, 
    CheckCircle2, 
    DollarSign, 
    RotateCcw, 
    ShieldCheck, 
    Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TransporterActionsProps {
    transportId: string;
    isShipped: boolean;
    isDelivered: boolean;
    currentStatus?: string;
}

export default function TransporterActions({ 
    transportId, 
    isShipped, 
    isDelivered,
    currentStatus 
}: TransporterActionsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleAction = async (type: 'SHIP' | 'DELIVER' | 'RETURN' | 'PAID') => {
        setLoading(type);
        const res = await updateTransportStatus(transportId, type);
        
        if (res.success) {
            toast.success(`LOGISTICS_SYNC_COMPLETE: Manifest ${type} verified.`);
            router.refresh();
        } else {
            toast.error(res.error || 'MANIFEST_SYNC_FAILED');
        }
        setLoading(null);
    };

    if (currentStatus === 'PAID') {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[1.5rem] w-full justify-center">
                <ShieldCheck size={20} className="text-emerald-500" />
                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">Manifest Fully Settled & Archived In Nexus Ledger</span>
            </div>
        );
    }

    if (currentStatus === 'RETURNED') {
         return (
            <div className="flex items-center gap-4 bg-rose-500/10 border border-rose-500/20 p-6 rounded-[1.5rem] w-full justify-center">
                <RotateCcw size={20} className="text-rose-500" />
                <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] italic">Manifest Flagged: Stock Rejected / Returned to Origin</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
             {/* Primary Status Controls */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isShipped && (
                    <button
                        onClick={() => handleAction('SHIP')}
                        disabled={!!loading}
                        className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest text-[10px] italic shadow-2xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading === 'SHIP' ? <Loader2 className="animate-spin" size={20} /> : <Truck size={20} />}
                        Initiate Shipping Protocol
                    </button>
                )}

                {isShipped && !isDelivered && (
                    <button
                        onClick={() => handleAction('DELIVER')}
                        disabled={!!loading}
                        className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest text-[10px] italic shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading === 'DELIVER' ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                        Confirm Final Destination
                    </button>
                )}

                {/* Secondary Tactical Controls (Exceptions & Settlement) */}
                <div className="flex gap-4 sm:col-span-2">
                    <button
                        onClick={() => handleAction('RETURN')}
                        disabled={!!loading}
                        className="flex-1 h-12 bg-white/5 hover:bg-rose-600 hover:text-white text-rose-500 border border-white/10 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[9px] italic transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading === 'RETURN' ? <Loader2 className="animate-spin" size={14} /> : <RotateCcw size={14} />}
                        Mark as Returns
                    </button>
                    <button
                        onClick={() => handleAction('PAID')}
                        disabled={!!loading}
                        className="flex-1 h-12 bg-white/5 hover:bg-amber-600 hover:text-white text-amber-500 border border-white/10 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[9px] italic transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading === 'PAID' ? <Loader2 className="animate-spin" size={14} /> : <DollarSign size={14} />}
                        Settle Payment
                    </button>
                </div>
             </div>
        </div>
    );
}
