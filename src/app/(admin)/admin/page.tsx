import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';
import { Package, Store, DollarSign, ShoppingCart, Activity } from 'lucide-react';
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
            <MotionWrapper className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Control <span className="text-blue-600">Matrix</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                        Operational Intelligence Registry
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 items-center">
                    <div className="w-64">
                        <BusinessSelector className="mb-0" />
                    </div>
                    <button className="px-5 h-12 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                        <Package size={14} className="text-blue-400" /> System Widget
                    </button>
                    <Link
                        href="/admin/inventory/new"
                        className="px-6 h-12 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest"
                    >
                        <ShoppingCart size={14} /> Deploy Asset
                    </Link>
                </div>
            </MotionWrapper>

            {/* Top Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Metric label="Total Assets" value={totalProducts} icon={Package} color="blue" />
                <Metric label="Active Nodes" value={totalShops} icon={Store} color="indigo" />
                <Metric label="Matrix Trans" value={totalSales} icon={ShoppingCart} color="emerald" />
                <Metric label="Net Value" value={`${baseCurrency?.symbol || '$'}${totalRevenue.toLocaleString()}`} icon={DollarSign} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performing Shops Chart */}
                <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 bg-white">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-black uppercase italic tracking-tighter">Node Performance Matrix</CardTitle>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Revenue Distribution Analysis</p>
                        </div>
                        <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-black italic">LIVE</div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <ShopPerformanceChart data={shopPerformanceChartData} />
                            <div className="space-y-3">
                                {shopPerformanceChartData.map((shop, i) => (
                                    <div key={shop.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-200 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-300 group-hover:text-blue-400">{String(i + 1).padStart(2, '0')}</span>
                                            <span className="font-bold text-slate-700 text-xs truncate max-w-[120px]">{shop.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-slate-900 text-xs font-mono italic">{shop.percentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Partner Shops List */}
                <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-slate-900 text-white p-6 flex justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-black uppercase italic tracking-tighter text-white">Partner Registry</CardTitle>
                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Active Operational Nodes</p>
                        </div>
                        <Link href="/admin/shops" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all">
                            <Store size={14} />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {shopSalesData.map(shop => (
                            <Link
                                key={shop.id}
                                href={`/admin/shops/${shop.id}`}
                                className="flex justify-between items-center px-4 py-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                            >
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 text-[11px] truncate uppercase">{shop.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{shop.location || 'GLOBAL_NODE'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-xs font-mono italic">{baseCurrency?.symbol || '$'}{shop.revenue.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[8px] text-slate-400 font-black uppercase">{shop.salesCount} TX</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Stream */}
            <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                    <div>
                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter">Activity Stream</CardTitle>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Real-time Transaction Logs</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {recentSales.length === 0 ? (
                            <div className="p-12 text-center">
                                <Activity size={32} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No matrix transactions recorded</p>
                            </div>
                        ) : (
                            recentSales.map(sale => (
                                <SaleDetailsDialog key={sale.id} sale={sale}>
                                    <div className="flex flex-col sm:flex-row justify-between p-6 hover:bg-slate-50/50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all shrink-0">
                                                <ShoppingCart size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{sale.shop.name}</p>
                                                    <span className="text-[9px] font-black text-slate-400 font-mono italic opacity-50">#{sale.number}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {sale.items.map((item: any) => (
                                                        <span key={item.id} className="text-[8px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-lg group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                                            {item.product.name} <span className="text-slate-300">×</span> {item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right mt-4 sm:mt-0 flex flex-col justify-between items-end">
                                            <div>
                                                <p className="font-black text-slate-900 text-sm font-mono italic leading-none">{baseCurrency?.symbol || '$'}{Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{new Date(sale.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <Link href="/admin/inventory" className="p-8 rounded-[2.5rem] bg-slate-900 text-white hover:bg-black transition-all flex flex-col md:flex-row justify-between items-center gap-6 group shadow-2xl shadow-slate-900/40 border border-slate-800">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                        <Package size={28} />
                    </div>
                    <div>
                        <div className="font-black text-2xl uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">Asset Management Matrix</div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Initialize deep scan of current registry distribution</p>
                    </div>
                </div>
                <div className="px-8 py-3 bg-white/10 rounded-xl font-black text-xs uppercase tracking-[0.2em] group-hover:bg-blue-600 transition-all border border-white/10 group-hover:border-blue-400 italic">
                    Access Grid →
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
