import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';
import { Package, Store, DollarSign, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import DeleteSaleButton from '@/components/DeleteSaleButton';
import MotionWrapper from '@/components/MotionWrapper';
import SaleDetailsDialog from '@/components/SaleDetailsDialog';
import { sanitizeData } from '@/lib/utils';
import ShopPerformanceChart from '@/components/ShopPerformanceChart';

export default async function AdminDashboard() {
    let totalProducts = 0;
    let totalShops = 0;
    let totalSales = 0;
    let totalRevenue = 0;
    let recentSales: any[] = [];
    let shopSalesData: any[] = [];

    let baseCurrency: any = null;

    try {
        baseCurrency = await prisma.currency.findFirst({ where: { isBase: true } });
        totalProducts = await prisma.product.count();
        totalShops = await prisma.shop.count();

        const rawSales = await prisma.sale.findMany({
            include: { shop: true, user: true, items: { include: { product: true } } },
            orderBy: { date: 'desc' },
        });

        const sales = sanitizeData(rawSales);
        totalSales = sales.length;
        totalRevenue = sales.reduce((s: number, sale: any) => s + Number(sale.total), 0);
        recentSales = sales.slice(0, 10);

        const rawShops = await prisma.shop.findMany({ include: { sales: true } });
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
        <section className="p-8 max-w-[1600px] mx-auto space-y-12">
            {/* Header */}
            <MotionWrapper className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Admin <span className="text-blue-600">Command</span>
                    </h1>
                    <p className="mt-3 text-slate-500 max-w-xl">
                        Operational visibility across inventory, revenue, and terminals.
                    </p>
                </div>

                <Link
                    href="/admin/inventory/new"
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                >
                    + New Asset
                </Link>
            </MotionWrapper>

            {/* Top Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Metric label="Products" value={totalProducts} icon={Package} />
                <Metric label="Shops" value={totalShops} icon={Store} />
                <Metric label="Sales" value={totalSales} icon={ShoppingCart} />
                <Metric label="Revenue" value={`${baseCurrency?.symbol || '$'}${totalRevenue.toLocaleString()}`} icon={DollarSign} />
            </div>

            {/* Top Performing Shops Chart */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Top Performing Shops</CardTitle>
                    <p className="text-xs text-slate-500 font-medium">
                        Revenue share by percentage
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <ShopPerformanceChart data={shopPerformanceChartData} />
                    <div className="space-y-2">
                        {shopPerformanceChartData.map((shop, i) => (
                            <div key={shop.name} className="flex justify-between text-sm">
                                <span className="font-semibold text-slate-700">{i + 1}. {shop.name}</span>
                                <span className="font-black text-slate-900">{shop.percentage.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Shops & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shops List */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="rounded-2xl">
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle>Shops</CardTitle>
                            <Link href="/admin/shops" className="text-sm text-blue-600 hover:underline">View all</Link>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {shopSalesData.map(shop => (
                                <Link
                                    key={shop.id}
                                    href={`/admin/shops/${shop.id}`}
                                    className="flex justify-between items-center px-4 py-3 rounded-xl hover:bg-slate-50 transition"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">{shop.name}</p>
                                        <p className="text-xs text-slate-400">{shop.location || 'Global'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{baseCurrency?.symbol || '$'}{shop.revenue.toLocaleString()}</p>
                                        <p className="text-xs text-slate-400">{shop.salesCount} sales</p>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle>Recent Activity Stream</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-slate-100">
                            {recentSales.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No recent activity recorded.</div>
                            ) : (
                                recentSales.map(sale => (
                                    <SaleDetailsDialog key={sale.id} sale={sale}>
                                        <div className="flex flex-col sm:flex-row justify-between p-6 hover:bg-slate-50 transition border-l-4 border-l-transparent hover:border-l-blue-600 group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <ShoppingCart size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{sale.shop.name} <span className="text-xs text-slate-400">#{sale.number}</span></p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {sale.items.map((item: any) => (
                                                            <span key={item.id} className="text-[10px] font-medium bg-slate-100 px-2 py-0.5 rounded">{item.product.name} ×{item.quantity}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right mt-4 sm:mt-0">
                                                <p className="font-black text-slate-900">{baseCurrency?.symbol || '$'}{Number(sale.total).toFixed(2)}</p>
                                                <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleDateString()}</p>
                                                <div className="mt-2 opacity-0 group-hover:opacity-100">
                                                    <DeleteSaleButton id={sale.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </SaleDetailsDialog>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Inventory Link */}
            <Link href="/admin/inventory" className="p-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition flex flex-col gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Package size={20} />
                </div>
                <div>
                    <div className="font-black text-xl mb-1 group-hover:translate-x-1 transition-transform">Inventory Matrix →</div>
                    <p className="text-xs text-slate-400 font-medium">Deep dive into current asset distribution and stock levels.</p>
                </div>
            </Link>
        </section>
    );
}

// Metric Component
function Metric({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
    return (
        <Card className="rounded-3xl">
            <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-xl font-black">{value}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
