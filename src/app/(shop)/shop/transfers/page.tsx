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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="flex items-center gap-6">
                        <Link href="/shop" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-black/10 group">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight uppercase leading-tight">
                                Stock <span className="text-indigo-600">Transfers</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Log of all stock movements to this location</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:w-auto">
                        <div className="bg-slate-50 px-8 py-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Transfers</span>
                            <span className="text-3xl font-bold text-slate-900 tracking-tighter font-mono">{totalTransfers}</span>
                        </div>
                        <div className="bg-slate-50 px-8 py-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Units</span>
                            <span className="text-3xl font-bold text-slate-900 tracking-tighter font-mono">{totalItems}</span>
                        </div>
                        <div className="bg-indigo-600 px-8 py-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col items-end text-white min-w-[160px]">
                            <span className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">Completed</span>
                            <span className="text-3xl font-bold tracking-tighter font-mono">{completedTransfers}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transfers List */}
            <div className="space-y-6">
                {transfers.length === 0 ? (
                    <div className="bg-white p-24 rounded-[3rem] border border-slate-200 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                            <TruckIcon size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">No transfers found</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Transfers from other locations will appear here</p>
                    </div>
                ) : (
                    transfers.map((transfer) => (
                        <div key={transfer.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row justify-between gap-10 mb-10 border-b border-slate-100 pb-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                            <TruckIcon className="text-indigo-400" size={24} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transfer Reference</div>
                                            <div className="text-slate-900 font-bold tracking-tight text-lg uppercase font-mono">ID_{transfer.id.slice(-8).toUpperCase()}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">
                                                <Calendar size={12} className="text-indigo-600" />
                                                {formatDateTime(transfer.date).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border-2 ${transfer.status === 'COMPLETED'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : transfer.status === 'PENDING'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {transfer.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Transfer Items */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Package size={14} className="text-indigo-600" /> Transferred Items
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {transfer.items.map((item) => (
                                            <div key={item.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center group/item hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all">
                                                <div>
                                                    <div className="text-[11px] font-bold text-slate-800 uppercase leading-none">
                                                        {item.product.name}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2 bg-white inline-block px-2 py-0.5 rounded border border-slate-200">
                                                        {item.product.sku}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-indigo-600 font-mono">
                                                        {item.quantity}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Units</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Total Items: 
                                            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-mono">
                                                {transfer.items.reduce((sum, item) => sum + item.quantity, 0)} UNITS
                                            </span>
                                        </div>
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
