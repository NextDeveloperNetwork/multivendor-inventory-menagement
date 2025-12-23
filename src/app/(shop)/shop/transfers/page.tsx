import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, TruckIcon, Package, Calendar, CheckCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default async function ShopTransfersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return <div className="p-12 text-center text-red-400">No shop assigned</div>;
    }

    const transfers = await prisma.transfer.findMany({
        where: {
            toShopId: session.user.shopId,
        },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
    });

    const totalTransfers = transfers.length;
    const totalItems = transfers.reduce((sum, transfer) =>
        sum + transfer.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const completedTransfers = transfers.filter(t => t.status === 'COMPLETED').length;

    return (
        <div className="space-y-8 fade-in">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link href="/shop" className="p-3 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 text-blue-500 transition-all shadow-sm">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Transfer History
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Incoming inventory log for this terminal.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-50 shadow-xl shadow-blue-500/5 flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <TruckIcon size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{totalTransfers}</div>
                        <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mt-1">Total Logs</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border-2 border-purple-50 shadow-xl shadow-purple-500/5 flex items-center gap-5">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                        <Package size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{totalItems}</div>
                        <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mt-1">Units Inbound</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-50 shadow-xl shadow-emerald-500/5 flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{completedTransfers}</div>
                        <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mt-1">Completed</div>
                    </div>
                </div>
            </div>

            {/* Transfers List */}
            <div className="space-y-6">
                {transfers.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] border-2 border-blue-50 text-center shadow-xl shadow-blue-500/5">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-200">
                            <TruckIcon size={40} />
                        </div>
                        <p className="text-xl font-bold text-slate-900">No transfers logged</p>
                        <p className="text-slate-400 mt-2">Inventory transfers from HQ will appear here.</p>
                    </div>
                ) : (
                    transfers.map((transfer) => (
                        <div key={transfer.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-lg shadow-blue-500/5 hover:border-blue-200 hover:shadow-blue-500/10 transition-all group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b-2 border-blue-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <TruckIcon size={24} />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-lg uppercase tracking-tight">
                                            Transfer #{transfer.id.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400 font-bold mt-1">
                                            <Calendar size={14} />
                                            {formatDateTime(transfer.date)}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${transfer.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : transfer.status === 'PENDING'
                                        ? 'bg-amber-100 text-amber-600'
                                        : 'bg-rose-100 text-rose-600'
                                    }`}>
                                    {transfer.status}
                                </div>
                            </div>

                            {/* Transfer Items */}
                            <div>
                                <h4 className="text-xs font-black text-blue-300 uppercase tracking-widest mb-4">Payload Contents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {transfer.items.map((item) => (
                                        <div key={item.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {item.product.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono font-bold mt-1 bg-white inline-block px-2 py-0.5 rounded-md border border-slate-200">
                                                    {item.product.sku}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-blue-600">
                                                    {item.quantity}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">units</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 text-right">
                                    <span className="text-sm font-medium text-slate-500">
                                        Total payload: <span className="font-black text-slate-900 text-lg">
                                            {transfer.items.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span> units
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
