import { prisma } from '@/lib/prisma';
import { Package, Store, DollarSign, ShoppingCart, Activity, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import DeleteSaleButton from '@/components/DeleteSaleButton';
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
        recentSales = sales.slice(0, 8);

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

    const totalRevenueAllShops = shopSalesData.reduce((s, shop) => s + shop.revenue, 0);

    const shopPerformanceChartData = shopSalesData
        .map(shop => ({
            name: shop.name,
            revenue: shop.revenue,
            percentage: totalRevenueAllShops ? (shop.revenue / totalRevenueAllShops) * 100 : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage);

    const sym = baseCurrency?.symbol || 'ALL';

    const metrics = [
        { label: 'Current Assets', value: totalProducts, icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Operating Sites', value: totalShops, icon: Store, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'Total Transactions', value: totalSales, icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { label: 'Net Revenue', value: `${sym} ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    ];

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Management Console</h1>
                        <p className="text-sm text-slate-400 font-medium">Strategic Business Overview & Performance</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    <Link
                        href="/admin/inventory/new"
                        className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
                    >
                        <ShoppingCart size={16} /> Register Sale
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(m => (
                    <div key={m.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${m.color}`}>
                            <m.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{m.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts & Partner Sites */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Commercial Site Performance</h3>
                            </div>
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Sync
                            </span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-1">
                            <ShopPerformanceChart data={shopPerformanceChartData} />
                            <div className="space-y-3">
                                {shopPerformanceChartData.map((shop, i) => (
                                    <div key={shop.name} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-400 font-mono w-4">{i + 1}.</span>
                                            <span className="font-semibold text-slate-800 text-xs">{shop.name}</span>
                                        </div>
                                        <span className="font-bold text-blue-600 text-sm">{shop.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partner Shops List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-900">Operational Network</h3>
                            <Link href="/admin/shops" className="text-slate-400 hover:text-blue-600 transition-colors">
                                <Store size={16} />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {shopSalesData.map(shop => (
                                <Link
                                    key={shop.id}
                                    href={`/admin/shops/${shop.id}`}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">{shop.name}</p>
                                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{shop.location || 'Global Site'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-slate-900 text-sm leading-none">{sym} {shop.revenue.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{shop.salesCount} TXN</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">Transaction Feed</h3>
                    <Link href="/admin/invoices" className="text-xs font-semibold text-blue-600 hover:underline">
                        View All
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {recentSales.length === 0 ? (
                        <div className="p-16 text-center">
                            <Activity size={32} strokeWidth={1.5} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-semibold text-slate-900">No transactions recorded</p>
                            <p className="text-xs text-slate-500 mt-1">Sales will appear here automatically</p>
                        </div>
                    ) : (
                        recentSales.map(sale => (
                            <SaleDetailsDialog key={sale.id} sale={sale}>
                                <div className="flex flex-col sm:flex-row justify-between p-6 hover:bg-slate-50 transition-colors group cursor-pointer gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <ShoppingCart size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-slate-900 text-sm">{sale.shop?.name || 'TERMINAL'}</p>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200">#{sale.number}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">
                                                {sale.items.map((i: any) => `${i.product.name} ×${i.quantity}`).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col justify-between items-end">
                                        <p className="font-bold text-slate-900 text-lg leading-none">{sym} {Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        <div className="flex items-center justify-end gap-3 mt-2">
                                            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                                <Clock size={10} className="text-slate-300" />
                                                {new Date(sale.date).toLocaleDateString()}
                                            </p>
                                            <div className="shrink-0">
                                                <DeleteSaleButton id={sale.id} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SaleDetailsDialog>
                        ))
                    )}
                </div>
            </div>

            {/* Inventory Shortcut Component */}
            <Link href="/admin/inventory" className="p-6 rounded-2xl bg-slate-900 hover:bg-black transition-colors flex flex-col sm:flex-row items-center justify-between gap-6 group">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Inventory Asset Registry</h3>
                        <p className="text-sm text-slate-400">Access high-resolution stock distribution controls</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                    Access Grid <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        </div>
    );
}
