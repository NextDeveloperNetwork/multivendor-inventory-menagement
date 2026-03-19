import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';
import { Package, Store, DollarSign, ShoppingCart, Activity, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DeleteSaleButton from '@/components/DeleteSaleButton';
import MotionWrapper from '@/components/MotionWrapper';
import SaleDetailsDialog from '@/components/SaleDetailsDialog';
import { sanitizeData } from '@/lib/utils';
import ShopPerformanceChart from '@/components/ShopPerformanceChart';
import { getBusinessFilter } from '@/app/actions/business';
import { BusinessSelector } from '@/components/BusinessSelector';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    let totalProducts = 0;
    let totalShops = 0;
    let totalSales = 0;
    let totalRevenue = 0;
    let recentSales: any[] = [];
    let shopSalesData: any[] = [];

    const filter = await getBusinessFilter();

    let baseCurrency: any = null;

    try {
        baseCurrency = await prisma.currency.findFirst({ where: { isBase: true } });
        totalProducts = await prisma.product.count({ where: filter as any });
        totalShops = await prisma.shop.count({ where: filter as any });

        const rawSales = await prisma.sale.findMany({
            where: filter as any,
            include: { shop: true, user: true, items: { include: { product: true } } },
            orderBy: { date: 'desc' },
        });

        const sales = sanitizeData(rawSales);
        totalSales = sales.length;
        totalRevenue = sales.reduce((s: number, sale: any) => s + Number(sale.total), 0);
        recentSales = sales.slice(0, 10);

        const rawShops = await prisma.shop.findMany({
            where: filter as any,
            include: { sales: true }
        });
        const shops = sanitizeData(rawShops);
        shopSalesData = shops.map((shop: any) => ({
            id: shop.id,
            name: shop.name,
            location: shop.location,
            salesCount: shop.sales.length,
            revenue: shop.sales.reduce((s: number, sale: any) => s + Number(sale.total), 0),
        }));
    } catch (e) {
        console.error(e);
    }

    const totalRevenueAllShops = shopSalesData.reduce(
        (s, shop) => s + shop.revenue,
        0
    );

    const shopPerformanceChartData = shopSalesData
        .map(shop => ({
            name: shop.name,
            revenue: shop.revenue,
            percentage: totalRevenueAllShops
                ? (shop.revenue / totalRevenueAllShops) * 100
                : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage);

    return (
        <section className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <MotionWrapper className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Management <span className="text-blue-600">Console</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Strategic Business Overview & Global Performance Registry
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 items-center">
                    <div className="w-64">
                        <BusinessSelector className="mb-0" />
                    </div>
                    <button className="px-6 h-12 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-black/10 border border-slate-800 italic">
                        <Activity size={16} className="text-blue-500" /> Analytics Panel
                    </button>
                    <Link
                        href="/admin/inventory/new"
                        className="px-8 h-12 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 text-[10px] uppercase tracking-widest italic"
                    >
                        <ShoppingCart size={16} /> Register Transaction
                    </Link>
                </div>
            </MotionWrapper>

            {/* Top Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Metric label="Current Assets" value={totalProducts} icon={Package} color="blue" />
                <Metric label="Operating Sites" value={totalShops} icon={Store} color="indigo" />
                <Metric label="Total Transactions" value={totalSales} icon={ShoppingCart} color="emerald" />
                <Metric label="Net Revenue" value={`${baseCurrency?.symbol || '$'}${totalRevenue.toLocaleString()}`} icon={DollarSign} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Performing Shops Chart */}
                <Card className="rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 bg-white hover:border-blue-600/30 transition-all duration-500">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Commercial Site Performance</CardTitle>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Revenue Contribution Analysis</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black italic shadow-sm">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            REAL_TIME
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <ShopPerformanceChart data={shopPerformanceChartData} />
                            <div className="space-y-4">
                                {shopPerformanceChartData.map((shop, i) => (
                                    <div key={shop.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[12px] font-black text-slate-300 group-hover:text-blue-500 transition-colors font-mono">{String(i + 1).padStart(2, '0')}</span>
                                            <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight italic">{shop.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-blue-600 text-[13px] font-mono italic">%{shop.percentage.toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Partner Shops List */}
                <Card className="rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden bg-white hover:border-blue-600/30 transition-all duration-500">
                    <CardHeader className="bg-slate-900 p-8 flex justify-between items-center relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Commercial Registry</CardTitle>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1 italic">Active Operational Network</p>
                        </div>
                        <Link href="/admin/shops" className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all border border-white/5 relative z-10 group">
                            <Store size={18} className="text-white group-hover:scale-110 transition-transform" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {shopSalesData.map(shop => (
                            <Link
                                key={shop.id}
                                href={`/admin/shops/${shop.id}`}
                                className="flex justify-between items-center px-6 py-4 rounded-[1.5rem] hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group shadow-sm hover:shadow-lg hover:shadow-slate-500/5"
                            >
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 text-xs truncate uppercase italic">{shop.name}</p>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic mt-1">{shop.location || 'GLOBAL_SITE'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-sm font-mono italic leading-none">{baseCurrency?.symbol || '$'}{shop.revenue.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-2 mt-1.5 opacity-60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{shop.salesCount} TX_ENTRY</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Stream */}
            <Card className="rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden bg-white hover:border-blue-600/30 transition-all duration-500">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Transaction Registry Feed</CardTitle>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Real-time Performance Monitoring</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black italic shadow-sm uppercase tracking-widest text-slate-500">
                            LIVE_STREAM
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {recentSales.length === 0 ? (
                            <div className="p-24 text-center">
                                <Activity size={48} className="mx-auto text-slate-100 mb-6" />
                                <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">No transactions recorded</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Awaiting initial commercial engagements</p>
                            </div>
                        ) : (
                            recentSales.map(sale => (
                                <SaleDetailsDialog key={sale.id} sale={sale}>
                                    <div className="flex flex-col sm:flex-row justify-between p-8 hover:bg-slate-50/50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600 relative overflow-hidden">
                                        <div className="flex items-start gap-6 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 shrink-0 shadow-lg group-hover:shadow-blue-500/20">
                                                <ShoppingCart size={22} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight italic">{sale.shop.name}</p>
                                                    <span className="text-[10px] font-black text-slate-400 font-mono italic px-2 py-0.5 bg-slate-100 rounded-lg">REG_{sale.number}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {sale.items.map((item: any) => (
                                                        <span key={item.id} className="text-[9px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-xl group-hover:border-blue-200 group-hover:text-blue-600 transition-all hover:scale-105">
                                                            {item.product.name} <span className="text-blue-400/50 mx-1">×</span> {item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right mt-6 sm:mt-0 flex flex-col justify-between items-end relative z-10">
                                            <div>
                                                <p className="font-black text-slate-900 text-2xl font-mono italic leading-none group-hover:text-blue-600 transition-colors">{baseCurrency?.symbol || '$'}{Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 italic flex items-center justify-end gap-2">
                                                    <Clock size={12} className="text-slate-300" /> {new Date(sale.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                <DeleteSaleButton id={sale.id} />
                                            </div>
                                        </div>
                                    </div>
                                </SaleDetailsDialog>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Link Footnote */}
            <Link href="/admin/inventory" className="p-10 rounded-[3rem] bg-slate-900 text-white hover:bg-black transition-all duration-700 flex flex-col md:flex-row justify-between items-center gap-8 group shadow-2xl shadow-slate-900/40 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/5 to-transparent"></div>
                <div className="flex items-center gap-8 text-center md:text-left relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Package size={36} />
                    </div>
                    <div>
                        <div className="font-black text-3xl uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">Inventory Asset Registry</div>
                        <p className="text-xs text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Access High-Resolution Stock Distribution Controls</p>
                    </div>
                </div>
                <div className="px-12 h-14 bg-white/10 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.3em] group-hover:bg-blue-600 transition-all border border-white/10 group-hover:border-blue-400 italic flex items-center gap-3 relative z-10 shadow-inner">
                    ACCESS_GRID <ArrowRight size={18} />
                </div>
            </Link>
        </section>
    );
}

// Metric Component
function Metric({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    };

    return (
        <Card className="rounded-[2rem] border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-5 py-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${colors[color] || 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-xl font-black text-slate-900 font-mono italic leading-none">{value}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
