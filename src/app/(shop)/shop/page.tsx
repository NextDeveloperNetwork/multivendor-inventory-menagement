import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
    ArrowRight,
    AlertTriangle,
    Package,
    TrendingUp,
    ShoppingCart,
    Clock,
    Star,
    Zap,
    Activity,
    Target,
    PieChart,
    Box,
    BarChart3,
    ArrowUpRight,
    CreditCard,
    History
} from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ShopDashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[80vh]">
                <div className="bg-white/80 backdrop-blur-3xl p-16 rounded-[3rem] border-2 border-slate-100 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] max-w-xl">
                    <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-sm ring-1 ring-rose-100">
                        <AlertTriangle className="text-rose-500" size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">Access <span className="text-rose-600">Denied</span></h1>
                    <p className="text-slate-500 mb-12 text-xl leading-relaxed font-medium">
                        Your neural link is pending authorization. An administrator must assign your credentials to a specific commercial node.
                    </p>
                    <div className="p-6 bg-slate-950 rounded-[2rem] text-[10px] text-white/40 font-black uppercase tracking-[0.3em] flex items-center justify-between">
                        <span>Terminal Identity</span>
                        <span className="font-mono text-emerald-400">{session?.user?.id?.slice(0, 12).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        );
    }

    const shopId = session.user.shopId;

    let shop: any = null;
    let inventoryCount = 0;
    let lowStockItems: any[] = [];
    let todaysSales = 0;
    let salesCount = 0;
    let recentSales: any[] = [];
    let stockValue = 0;
    let currencies: any[] = [];

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [shopData, invCount, lowStock, inventoryData, currenciesRaw] = await Promise.all([
            prisma.shop.findUnique({
                where: { id: shopId },
                include: { currency: true }
            }),
            prisma.inventory.count({ where: { shopId } }),
            prisma.inventory.findMany({
                where: { shopId, quantity: { lt: 10 } },
                orderBy: { quantity: 'asc' },
                take: 8,
                include: { product: true }
            }),
            prisma.inventory.findMany({
                where: { shopId },
                include: { product: true }
            }),
            prisma.currency.findMany({
                orderBy: { code: 'asc' }
            })
        ]);

        shop = shopData;
        inventoryCount = invCount;
        lowStockItems = lowStock;
        currencies = sanitizeData(currenciesRaw);

        const rate = Number(shop?.currency?.rate) || 1;

        // Calculate total stock value in local currency
        stockValue = inventoryData.reduce((acc, inv) => {
            return acc + (Number(inv.quantity) * Number(inv.product.price) * rate);
        }, 0);

        const salesRaw = await prisma.sale.findMany({
            where: { shopId, date: { gte: startOfDay } }
        });

        salesCount = salesRaw.length;
        todaysSales = salesRaw.reduce((acc: number, sale: any) => acc + Number(sale.total), 0);

        const recentSalesRaw = await prisma.sale.findMany({
            where: { shopId },
            orderBy: { date: 'desc' },
            take: 8,
            include: {
                items: { include: { product: true } },
                user: true
            }
        });
        recentSales = sanitizeData(recentSalesRaw);

    } catch (e) {
        console.error("Dashboard Engine Critical Error:", e);
    }

    const symbol = shop?.currency?.symbol || '$';
    const avgSale = salesCount > 0 ? todaysSales / salesCount : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24 space-y-12 animate-in fade-in duration-700">
            {/* Command Header */}
            <div className="relative overflow-hidden bg-white rounded-[4rem] p-12 shadow-2xl shadow-blue-500/10 mx-4 md:mx-0 border-2 border-blue-50">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-96 -mt-96 blur-[120px] opacity-50"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-600/30">
                                <Zap className="text-white" size={24} />
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Live Dashboard</span>
                        </div>
                        <h1 className="text-6xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent tracking-tighter uppercase italic leading-none">
                            {shop?.name || 'Terminal'} <span className="text-blue-600">Hub</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            Welcome, <span className="text-blue-600 border-b-2 border-blue-200 pb-1">{session.user.name}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="px-8 py-5 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100 rounded-[2rem] text-[12px] font-black text-blue-900 uppercase tracking-widest flex flex-col items-center shadow-sm">
                            <span className="text-blue-400 text-[8px] mb-1">Today</span>
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                        </div>
                        <Link href="/shop/pos" className="group h-20 px-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center gap-5 uppercase tracking-[0.2em] text-[11px] border-2 border-blue-400">
                            <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" /> New Sale
                        </Link>
                    </div>
                </div>

                {/* Primary HUD Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 relative z-10">
                    <div className="bg-white border-2 border-emerald-100 p-8 rounded-[2.5rem] group hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                <TrendingUp size={20} />
                            </div>
                            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">Live</div>
                        </div>
                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Today's Revenue</div>
                        <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent tabular-nums tracking-tighter">{symbol}{todaysSales.toLocaleString()}</div>
                    </div>

                    <div className="bg-white border-2 border-blue-100 p-8 rounded-[2.5rem] group hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <Activity size={20} />
                            </div>
                            <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-200">Active</div>
                        </div>
                        <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Transactions</div>
                        <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent tabular-nums tracking-tighter">{salesCount}</div>
                    </div>

                    <div className="bg-white border-2 border-purple-100 p-8 rounded-[2.5rem] group hover:shadow-xl hover:shadow-purple-500/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                <PieChart size={20} />
                            </div>
                        </div>
                        <div className="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em] mb-2">Average Sale</div>
                        <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent tabular-nums tracking-tighter">{symbol}{avgSale.toFixed(0)}</div>
                    </div>

                    <div className="bg-white border-2 border-orange-100 p-8 rounded-[2.5rem] group hover:shadow-xl hover:shadow-orange-500/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                <Box size={20} />
                            </div>
                        </div>
                        <div className="text-[9px] font-black text-orange-600 uppercase tracking-[0.3em] mb-2">Stock Value</div>
                        <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent tabular-nums tracking-tighter">{symbol}{stockValue.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Application Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 md:px-0">

                {/* Secondary Actions Sidebar */}
                <div className="lg:col-span-1 space-y-10">
                    {/* Exchange Rates Interface */}
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-500/5 border-2 border-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full -mr-32 -mt-32 blur-[60px] opacity-50"></div>
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                <TrendingUp size={16} className="text-emerald-500" /> Exchange Rates
                            </h3>
                            <div className="space-y-4">
                                {currencies.map((c: any) => {
                                    const relativeRate = Number(c.rate) / (Number(shop?.currency?.rate) || 1);
                                    return (
                                        <div key={c.id} className="flex items-center justify-between p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-100 group hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center font-black text-[10px] text-white group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">{c.code}</div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-slate-900">{c.name}</div>
                                                    <div className="text-[8px] font-bold uppercase text-blue-400 tracking-widest mt-1">Live Rate</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black tracking-tighter tabular-nums text-emerald-600">
                                                    {symbol}1.00 = {c.symbol}{relativeRate.toFixed(4)}
                                                </div>
                                                <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1">Exchange</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-10 border-2 border-blue-50 shadow-xl shadow-blue-500/5">
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                            <Target size={16} className="text-blue-600" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/shop/inventory" className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 group hover:from-blue-600 hover:to-blue-500 hover:border-blue-600 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/20">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <Package size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:text-white transition-colors text-center">Inventory</span>
                            </Link>
                            <Link href="/shop/history" className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 group hover:from-orange-600 hover:to-orange-500 hover:border-orange-600 transition-all shadow-sm hover:shadow-xl hover:shadow-orange-500/20">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <History size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 group-hover:text-white transition-colors text-center">History</span>
                            </Link>
                            <Link href="/shop/transfers" className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 group hover:from-emerald-600 hover:to-emerald-500 hover:border-emerald-600 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-500/20">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <TrendingUp size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover:text-white transition-colors text-center">Transfers</span>
                            </Link>
                            <Link href="/admin" className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 group hover:from-purple-600 hover:to-purple-500 hover:border-purple-600 transition-all shadow-sm hover:shadow-xl hover:shadow-purple-500/20">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <Zap size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 group-hover:text-white transition-colors text-center">Admin</span>
                            </Link>
                        </div>
                    </div>

                    {/* Critical Depletion Module */}
                    <div className="bg-white rounded-[3.5rem] overflow-hidden border-2 border-rose-100 shadow-xl shadow-rose-500/10">
                        <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-8 flex justify-between items-center text-white">
                            <div className="flex items-center gap-4">
                                <AlertTriangle size={24} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-[0.3em]">Low Stock Alert</span>
                            </div>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase backdrop-blur-sm">{lowStockItems.length} Items</span>
                        </div>
                        <div className="p-6 divide-y divide-slate-50">
                            {lowStockItems.length === 0 ? (
                                <div className="py-12 text-center text-emerald-500 font-black uppercase tracking-widest text-[10px] flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                                        <Star className="text-emerald-500" size={24} />
                                    </div>
                                    All Stock Levels Optimal
                                </div>
                            ) : (
                                lowStockItems.map((item: any) => (
                                    <div key={item.id} className="py-6 flex items-center justify-between group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-all border-2 border-rose-100">
                                                <Box size={22} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 uppercase leading-none">{item.product.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{item.product.sku}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] font-black px-4 py-2 rounded-xl border-2 ${item.quantity <= 0 ? 'bg-black text-white border-black' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                                                {item.quantity} Units
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Telemetry Table */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white rounded-[3.5rem] border-2 border-blue-50 shadow-xl shadow-blue-500/5 flex flex-col h-full overflow-hidden">
                        <div className="p-10 border-b-2 border-blue-50 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-4">
                                <BarChart3 size={18} className="text-blue-600" /> Recent Sales
                            </h3>
                            <Link href="/shop/history" className="text-[9px] font-black text-blue-600 bg-white px-5 py-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all uppercase tracking-[0.2em] border-2 border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/20">
                                View All
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gradient-to-r from-slate-50 to-blue-50 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-b-2 border-blue-100">
                                    <tr>
                                        <th className="px-10 py-6">Transaction</th>
                                        <th className="px-6 py-6">Items</th>
                                        <th className="px-6 py-6">Cashier</th>
                                        <th className="px-6 py-6 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-50">
                                    {recentSales.map((sale: any) => (
                                        <tr key={sale.id} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">#{sale.number}</span>
                                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-2">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-wrap gap-2">
                                                    {sale.items.map((item: any) => (
                                                        <span key={item.id} className="px-3 py-1 bg-white text-[9px] font-black rounded-lg text-blue-600 uppercase tracking-widest border-2 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                                                            {item.product.name} ×{item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 border-2 border-purple-200">
                                                        <CreditCard size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sale.user.name.split(' ')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="text-xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent tracking-tighter tabular-nums">
                                                    {symbol}{(Number(sale.total) * (Number(shop?.currency?.rate) || 1)).toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
