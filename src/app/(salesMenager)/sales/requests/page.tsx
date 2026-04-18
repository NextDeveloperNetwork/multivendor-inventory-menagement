import React from 'react';
import { ClipboardList, Package, Clock, Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CreateInventoryRequestForm from '@/components/CreateInventoryRequestForm';
import { getInventoryRequests } from '@/app/actions/salesOps';
import { getBusinessFilter } from '@/app/actions/business';
import { sanitizeData, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SalesRequestsPage() {
    const session = await getServerSession(authOptions);
    const requests = await getInventoryRequests();
    const businessFilter = await getBusinessFilter();
    const rawProducts = await (prisma as any).product.findMany({
        where: { ...businessFilter },
        orderBy: { name: 'asc' }
    });
    const products = sanitizeData(rawProducts);

    const pending = requests.filter((r: any) => r.status === 'PENDING').length;
    const approved = requests.filter((r: any) => r.status === 'APPROVED').length;

    return (
        <div className="flex flex-col min-h-full">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-100 px-4 py-5 flex items-center justify-between sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                        Restock <span className="text-blue-600">Requests</span>
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Inventory Requisition Portal
                    </p>
                </div>
                <CreateInventoryRequestForm products={products} userName={session?.user?.name || 'Manager'} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 px-4 pt-4">
                {[
                    { label: 'Total', value: requests.length, color: 'text-slate-900' },
                    { label: 'Pending', value: pending, color: 'text-amber-600' },
                    { label: 'Approved', value: approved, color: 'text-emerald-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
                        <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 px-4 py-4 pb-32 space-y-3">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                            <ClipboardList size={28} className="text-slate-300" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Active Requisitions</p>
                        <p className="text-[9px] text-slate-300 mt-1 max-w-[200px] leading-relaxed">
                            Tap "New Request" to submit a restock requisition to admin.
                        </p>
                    </div>
                ) : requests.map((req: any) => (
                    <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                req.status === 'APPROVED' ? 'bg-emerald-50' : req.status === 'PENDING' ? 'bg-amber-50' : 'bg-slate-100'
                            )}>
                                <Package size={18} className={cn(
                                    req.status === 'APPROVED' ? 'text-emerald-500' : req.status === 'PENDING' ? 'text-amber-500' : 'text-slate-400'
                                )} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-slate-100 text-slate-600'
                                    )}>
                                        {req.status}
                                    </span>
                                    <span className="text-[8px] text-slate-300 font-bold">#{req.id.slice(-6)}</span>
                                </div>
                                <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{req.product?.name || req.productName || 'Unnamed Item'}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">×{req.quantity}</span>
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} className="text-slate-300" />
                                        <span className="text-[9px] text-slate-400" suppressHydrationWarning>{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {req.notes && (
                                    <p className="text-[10px] text-slate-500 italic mt-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
                                        "{req.notes}"
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
