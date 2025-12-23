import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Clock, ShoppingCart, User, Tag, ChevronRight } from 'lucide-react';
import ShopHistoryFilters from '@/components/ShopHistoryFilters';
import { sanitizeData } from '@/lib/utils';

interface ShopHistoryPageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        q?: string;
    }>
}

export default async function ShopHistoryPage({ searchParams }: ShopHistoryPageProps) {
    const session = await getServerSession(authOptions);
    const params = await searchParams;
    const { startDate, endDate, q } = params;

    if (!session?.user?.shopId) {
        return <div className="p-12 text-center text-red-400">No shop assigned</div>;
    }

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.date.lte = end;
        }
    }

    const where: any = {
        shopId: session.user.shopId,
        ...dateFilter
    };

    if (q) {
        where.OR = [
            { id: { contains: q, mode: 'insensitive' } },
            { number: { contains: q, mode: 'insensitive' } }
        ];
    }

    const rawSales = await prisma.sale.findMany({
        where,
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            user: true,
        },
        orderBy: {
            date: 'desc',
        },
    });

    const sales = sanitizeData(rawSales);

    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const totalTransactions = sales.length;

    return (
        <div className="space-y-12 fade-in">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/shop" className="p-4 bg-white border border-blue-100 rounded-2xl hover:bg-blue-50 text-blue-500 transition-all shadow-sm">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                Sales History
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Transaction log for this terminal.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white px-8 py-4 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">{totalTransactions}</span>
                        </div>
                        <div className="bg-white px-8 py-4 rounded-2xl border-2 border-emerald-50 shadow-sm flex flex-col items-end">
                            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Revenue</span>
                            <span className="text-3xl font-black text-emerald-500 tracking-tighter">${totalRevenue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <ShopHistoryFilters />

            {/* Sales List */}
            <div className="space-y-6">
                {sales.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] border-2 border-blue-50 text-center shadow-xl shadow-blue-500/5">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
                            <ShoppingCart size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Sales Found</h3>
                        <p className="text-slate-400 mt-2">Your shop hasn't recorded any sales yet.</p>
                        <Link href="/shop/pos" className="inline-flex mt-8 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] transition-all">
                            Start Selling
                        </Link>
                    </div>
                ) : (
                    sales.map((sale: any) => (
                        <div key={sale.id} className="bg-white border-2 border-blue-50 rounded-[2.5rem] overflow-hidden hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row justify-between gap-10">
                                    {/* Sale Info */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                                                    <Clock className="text-slate-400" size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Ref</div>
                                                    <div className="font-mono text-slate-900 font-bold tracking-wider">#{sale.number}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</div>
                                                <div className="text-slate-900 font-bold text-sm">
                                                    {new Date(sale.date).toLocaleDateString()} <span className="text-slate-300">|</span> {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                                    <User size={18} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sold By</span>
                                                    <span className="font-bold text-slate-900 text-sm">{sale.user.name || 'Unknown User'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                                    <Tag size={18} className="text-purple-500" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Volume</span>
                                                    <span className="font-bold text-slate-900 text-sm">{sale.items.length} Items</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items & Total */}
                                    <div className="lg:w-96 flex flex-col justify-between lg:border-l border-slate-100 lg:pl-10 pt-6 lg:pt-0">
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cart Summary</div>
                                            {sale.items.slice(0, 3).map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <span className="text-slate-600 font-medium truncate flex-1 mr-4">{item.product.name} <span className="text-slate-400">x{item.quantity}</span></span>
                                                    <span className="text-slate-900 font-bold font-mono">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {sale.items.length > 3 && (
                                                <div className="text-xs text-blue-500 font-bold px-3 italic">+ {sale.items.length - 3} more items</div>
                                            )}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-end justify-between">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</div>
                                                <div className="text-3xl font-black text-emerald-500 tracking-tighter">${Number(sale.total).toFixed(2)}</div>
                                            </div>
                                            <button className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all">
                                                <ChevronRight size={24} />
                                            </button>
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
