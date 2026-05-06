import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminProductionTrackingClient from '@/components/AdminProductionTrackingClient';
import { Activity } from 'lucide-react';
import { getSelectedBusinessId } from '@/app/actions/business';
import { getAdminDailyProductionLogs } from '@/app/actions/production';

export const dynamic = 'force-dynamic';

export default async function ProductionManagerTrackingPage() {
    const businessId = await getSelectedBusinessId();

    // Fetch initial logs (Today by default)
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = await getAdminDailyProductionLogs(businessId || undefined, todayStr);

    const employees = await prisma.user.findMany({
        where: businessId ? { shop: { businessId } } : {}
    });

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 ring-4 ring-white">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Output Intelligence</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>
                             Admin Command Center: Finished Goods Monitoring
                        </p>
                    </div>
                </div>
            </div>

            <AdminProductionTrackingClient 
                initialLogs={logs}
                employees={employees}
                businessId={businessId || undefined}
            />
        </div>
    );
}
