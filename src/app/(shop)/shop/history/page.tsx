import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShoppingCart, Clock, User, Tag, ChevronRight, Activity, DollarSign } from 'lucide-react';
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
        return <div className="p-12 text-center text-red-500 font-medium">No shop assigned</div>;
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

    const where: any = { shopId: session.user.shopId, ...dateFilter };

    if (q) {
        where.OR = [
            { id: { contains: q, mode: 'insensitive' } },
            { number: { contains: q, mode: 'insensitive' } }
        ];
    }

    const [rawSales, shop] = await Promise.all([
        prisma.sale.findMany({
            where,
            include: { items: { include: { product: true } }, user: true },
            orderBy: { date: 'desc' },
        }),
        prisma.shop.findUnique({
            where: { id: session.user.shopId },
            include: { currency: true }
        })
    ]);

    const sales = sanitizeData(rawSales);
    const symbol = shop?.currency?.symbol || 'ALL';
    const rate = Number(shop?.currency?.rate) || 1;

    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (Number(sale.total) * rate), 0);
    const totalTransactions = sales.length;

    const stats = [
        { label: 'Total Sales', value: totalTransactions, icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Revenue', value: `${symbol} ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    ];

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Sales Reports</h1>
                        <p className="text-sm text-slate-400 font-medium">Transaction history for this location</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <ShopHistoryFilters />
            </div>

            {/* Sales List */}
            <div className="space-y-4">
                {sales.length === 0 ? (
                    <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
                        <ShoppingCart size={48} strokeWidth={1.5} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No sales found</h3>
                        <p className="text-sm text-slate-500 mb-6">Record sales in the terminal to see history here</p>
                        <Link href="/shop/pos" className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-500 transition-colors">
                            Sales Terminal
                        </Link>
                    </div>
                ) : (
                    sales.map((sale: any) => (
                        <div key={sale.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 transition-colors shadow-sm">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Sale Info */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Receipt Number</p>
                                                    <p className="text-lg font-bold text-slate-900 font-mono tracking-tight leading-none">#{sale.number}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {new Date(sale.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                                                <User size={14} className="text-slate-400" /> {sale.user.name || 'Staff'}
                                            </div>
                                            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                                                <Tag size={14} className="text-slate-400" /> {sale.items.length} items
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items & Total */}
                                    <div className="lg:w-80 flex flex-col justify-between lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100">
                                        <div className="space-y-1 mb-6">
                                            {sale.items.slice(0, 3).map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center py-1">
                                                    <span className="text-xs font-semibold text-slate-600 truncate mr-2">{item.product.name} ×{item.quantity}</span>
                                                    <span className="text-xs font-bold text-slate-900 font-mono shrink-0">{symbol} {((Number(item.price) * rate) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {sale.items.length > 3 && (
                                                <div className="text-[10px] font-semibold text-indigo-500 pt-1">+ {sale.items.length - 3} more items</div>
                                            )}
                                        </div>

                                        <div className="flex items-end justify-between border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                                                <p className="text-2xl font-black text-slate-900 font-mono leading-none tracking-tight">{symbol} {(Number(sale.total) * rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                                                <ChevronRight size={18} />
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
