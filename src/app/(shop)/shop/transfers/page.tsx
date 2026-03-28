import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArrowLeftRight, TruckIcon, Package, Calendar, Settings } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ShopTransfersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return <div className="p-12 text-center text-red-500 font-medium">No shop assigned</div>;
    }

    const rawTransfers = await prisma.transfer.findMany({
        where: { toShopId: session.user.shopId },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' },
    });

    const transfers = sanitizeData(rawTransfers);

    const totalTransfers = transfers.length;
    const totalItems = transfers.reduce((sum: number, trans: any) =>
        sum + trans.items.reduce((acc: number, item: any) => acc + item.quantity, 0), 0
    );
    const completedOpt = transfers.filter((t: any) => ['COMPLETED', 'DELIVERED', 'PAID'].includes(t.status)).length;

    const stats = [
        { label: 'Total Transfers', value: totalTransfers, icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Units Received', value: totalItems, icon: Package, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'Completed', value: completedOpt, icon: TruckIcon, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    ];

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <ArrowLeftRight size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Stock Transfers</h1>
                        <p className="text-sm text-slate-400 font-medium">Log of stock movements to this location</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transfers List */}
            <div className="space-y-4">
                {transfers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                        <TruckIcon size={40} strokeWidth={1.5} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No transfers found</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Stock inbound to this location will appear here</p>
                    </div>
                ) : (
                    transfers.map((transfer: any) => (
                        <div key={transfer.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-indigo-300 transition-colors">
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <TruckIcon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">#{transfer.id.slice(-8).toUpperCase()}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                            <Calendar size={12} className="text-indigo-500" />
                                            {formatDateTime(transfer.date)}
                                        </div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border max-w-max ${
                                    ['COMPLETED', 'DELIVERED', 'PAID'].includes(transfer.status)
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : transfer.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                    {transfer.status}
                                </span>
                            </div>
                            
                            <div className="p-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={14} className="text-indigo-600" /> Transferred Items
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {transfer.items.map((item: any) => (
                                        <div key={item.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                                            <div className="min-w-0 pr-4">
                                                <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product.sku}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-bold text-indigo-600 font-mono leading-none">{item.quantity}</p>
                                                <p className="text-[10px] text-slate-400 font-medium tracking-wide">units</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                                    <div className="text-xs font-bold text-slate-500">
                                        Total Items: <span className="bg-slate-100 px-3 py-1 rounded text-slate-900 border border-slate-200 ml-2">{transfer.items.reduce((s: number, i: any) => s + i.quantity, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
