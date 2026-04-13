import React from 'react';
import { prisma } from '@/lib/prisma';
import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';
import { ClipboardList, Users, Package, Calendar, Activity, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { clearProductionLogs } from '@/app/actions/production';
import Link from 'next/link';
import { ProductionRosterFilterBar } from '@/components/ProductionRosterFilterBar';
import { DeleteLogButton } from '@/components/DeleteLogButton';
import { Search, Filter, Hash } from 'lucide-react';


export const dynamic = 'force-dynamic';

export default async function ProductionRosterPage(props: { searchParams: Promise<{ q?: string; date?: string }> }) {
    const searchParams = await props.searchParams;
    const businessId = await getSelectedBusinessId();
    const query = searchParams.q || '';
    const dateQuery = searchParams.date || '';

    const allEmployees = await prisma.user.findMany({
        where: businessId ? { shop: { businessId } } : {}
    });

    // Find worker IDs matching the search query to allow searching by name
    const matchingWorkerIds = allEmployees
        .filter(e => e.name?.toLowerCase().includes(query.toLowerCase()))
        .map(e => e.id);

    // @ts-ignore - Temporary bypass for Prisma generation lock on Windows
    const logs = await prisma.productionLog.findMany({
        where: {
            ...(businessId ? { businessId } : {}),
            isManager: false,
            ...(query ? {
                OR: [
                    { articleName: { contains: query, mode: 'insensitive' } },
                    { procName: { contains: query, mode: 'insensitive' } },
                    { workerId: { in: matchingWorkerIds } }
                ]
            } : {}),
            ...(dateQuery ? {
                date: {
                    gte: new Date(dateQuery),
                    lte: new Date(new Date(dateQuery).setHours(23, 59, 59, 999))
                }
            } : {})
        },
        orderBy: { date: 'desc' },
        take: 1000
    });


    const employees = allEmployees;


    const stats = {
        totalYield: logs.reduce((sum: number, l: any) => sum + l.quantity, 0),
        finalYield: logs.filter((l: any) => l.isFinal).reduce((sum: number, l: any) => sum + l.quantity, 0),
        distinctWorkers: new Set(logs.map((l: any) => l.workerId)).size,
        distinctOrders: new Set(logs.map((l: any) => l.orderId)).size
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none group-hover:bg-indigo-600/10 transition-all duration-700" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 ring-4 ring-white">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operational Roster</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Immutable Labory-Yield Registry · Audit Ready</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-px bg-slate-100 hidden md:block mx-2" />
                    <Link href="/admin/production/planning" className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
                        Go to Scheduler
                    </Link>
                </div>
            </div>

            {/* Tactical Filters */}
            <ProductionRosterFilterBar initialSearch={query} initialDate={dateQuery} />

            {/* Tactical Stats Grid */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Cumulative Yield', value: stats.totalYield, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Finished Stock', value: stats.finalYield, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Labor Force (Actives)', value: stats.distinctWorkers, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Active Pipeline', value: stats.distinctOrders, icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all duration-300">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
                            <div className="text-2xl font-black text-slate-900 tabular-nums">{stat.value.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Audit Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-8 py-5 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Live Production Feed</h2>
                    </div>
                    <form action={async () => { 'use server'; await clearProductionLogs(businessId || undefined); }}>
                        <button type="submit" className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2">
                            <Trash2 size={12} /> Wipe Audit Log
                        </button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="px-8 py-4 text-left font-black">Shift Date</th>
                                <th className="px-6 py-4 text-left font-black">Vocal Specialist</th>
                                <th className="px-6 py-4 text-left font-black">Production Group</th>
                                <th className="px-6 py-4 text-left font-black">Process Status</th>
                                <th className="px-6 py-4 text-right font-black">Yield Qty</th>
                                <th className="px-8 py-4 text-center font-black">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log: any) => {
                                const workerName = employees.find(e => e.id === log.workerId)?.name || 'Internal Resource';
                                return (
                                    <tr key={log.id} className="hover:bg-indigo-50/20 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-700 font-mono tracking-tight">{format(new Date(log.date), 'MMM dd, yyyy')}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{workerName[0]}</div>
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{workerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-indigo-600 truncate max-w-[180px] uppercase">{log.articleName}</span>
                                                <span className="text-[8px] text-slate-400 font-bold tracking-tighter">ID: {log.orderId.substring(0,8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.isFinal ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                                {log.isFinal ? <Package size={10} /> : <Activity size={10} />}
                                                {log.procName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{log.quantity.toLocaleString()}</span>
                                            <span className="ml-1 text-[8px] text-slate-400 font-bold uppercase">pcs</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="bg-emerald-50 text-emerald-600 h-8 w-8 rounded-lg flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                                    <Activity size={12} />
                                                </div>
                                                <DeleteLogButton id={log.id} />
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                            <ClipboardList size={40} className="text-slate-200" />
                                        </div>
                                        <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-loose">
                                            The operational roster is empty.<br/>Please verify quantities in the Minute View to log production.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

