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

    const [rawSales, shop] = await Promise.all([
        prisma.sale.findMany({
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
        }),
        prisma.shop.findUnique({
            where: { id: session.user.shopId },
            include: { currency: true }
        })
    ]);

    const sales = sanitizeData(rawSales);
    const symbol = shop?.currency?.symbol || '$';

    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const totalTransactions = sales.length;

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/shop" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-black/10 group">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight uppercase leading-tight">
                                Sales <span className="text-indigo-600">Reports</span> Overview
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Complete log of all sales conducted at this location</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-slate-50 px-8 py-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</span>
                            <span className="text-3xl font-bold text-slate-900 tracking-tighter font-mono">{totalTransactions}</span>
                        </div>
                        <div className="bg-indigo-600 px-8 py-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col items-end text-white min-w-[200px]">
                            <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Total Revenue</span>
                            <span className="text-3xl font-bold tracking-tighter font-mono">{symbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm max-w-4xl mx-auto">
                <ShopHistoryFilters />
            </div>

            {/* Sales List */}
            <div className="space-y-6">
                {sales.length === 0 ? (
                    <div className="bg-white p-24 rounded-[3rem] border border-slate-200 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                            <ShoppingCart size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">No sales found</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Add items in the sales terminal to see them here</p>
                        <Link href="/shop/pos" className="inline-flex mt-10 px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px]">
                            Go to Sales Terminal
                        </Link>
                    </div>
                ) : (
                    sales.map((sale: any) => (
                        <div key={sale.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row justify-between gap-10">
                                    {/* Sale Info */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                                    <Clock className="text-indigo-400" size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sale Reference</div>
                                                    <div className="text-slate-900 font-bold tracking-tight text-lg uppercase font-mono">ID_{sale.number}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</div>
                                                <div className="text-slate-900 font-bold text-xs mt-1 uppercase">
                                                    {new Date(sale.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} <span className="text-indigo-200 mx-2">|</span> {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                                                    <User size={18} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Managed By</span>
                                                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-tight">{sale.user.name || 'STAFF_USER'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                                                    <Tag size={18} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Items Sold</span>
                                                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-tight">{sale.items.length} Products</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items & Total */}
                                    <div className="lg:w-[380px] flex flex-col justify-between lg:border-l border-slate-100 lg:pl-10 pt-6 lg:pt-0">
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sale Summary</div>
                                            {sale.items.slice(0, 3).map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group/item">
                                                    <span className="text-slate-600 font-bold text-[10px] uppercase truncate flex-1 mr-4">{item.product.name} <span className="text-indigo-400 mx-1">×</span>{item.quantity}</span>
                                                    <span className="text-slate-900 font-bold text-[11px] font-mono">{symbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {sale.items.length > 3 && (
                                                <div className="text-[9px] text-indigo-500 font-bold px-3 uppercase tracking-widest">+ {sale.items.length - 3} Additional Items</div>
                                            )}
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-slate-100 flex items-end justify-between">
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sale Total</div>
                                                <div className="text-4xl font-bold text-slate-900 tracking-tighter font-mono group-hover:text-indigo-600 transition-colors leading-none mt-1">{symbol}{Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <button className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg group-hover:scale-110">
                                                <ChevronRight size={20} />
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
