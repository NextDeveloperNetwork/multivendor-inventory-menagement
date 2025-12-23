import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';
import { Package, Store, DollarSign, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import DeleteSaleButton from '@/components/DeleteSaleButton';
import MotionWrapper from '@/components/MotionWrapper';
import SaleDetailsDialog from '@/components/SaleDetailsDialog';
import { sanitizeData } from '@/lib/utils';

export default async function AdminDashboard() {
    let totalProducts = 0;
    let totalShops = 0;
    let totalSales = 0;
    let totalRevenue = 0;
    let recentSales: any[] = [];
    let shopSalesData: any[] = [];


    try {
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

    return (
        <section className="p-8 flex flex-col gap-12 max-w-[1600px] mx-auto">
            {/* Header */}
            <MotionWrapper className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Admin <span className="text-blue-600">Command</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
                        High-level operational visibility across inventory, revenue, and terminals.
                    </p>
                </div>

                <Link href="/admin/inventory/new" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-200">
                    + New Asset
                </Link>
            </MotionWrapper>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent>
                        <CardValue value={totalProducts} icon={Package} />
                        <p className="mt-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Products</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <CardValue value={totalShops} icon={Store} />
                        <p className="mt-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Shops</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <CardValue value={totalSales} icon={ShoppingCart} />
                        <p className="mt-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Sales</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <CardValue value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
                        <p className="mt-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Revenue</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Shops */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle>Shop Performance</CardTitle>
                            <Link href="/admin/shops" className="text-sm font-bold text-blue-600 hover:text-blue-700">View all</Link>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-1">
                            {shopSalesData.map(shop => (
                                <Link key={shop.id} href={`/admin/shops/${shop.id}`} className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                    <div>
                                        <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{shop.name}</p>
                                        <p className="text-xs font-medium text-slate-500">{shop.location || 'Global'}</p>
                                    </div>

                                    <div className="text-right">
                                        <strong className="block text-slate-900">${shop.revenue.toLocaleString()}</strong>
                                        <span className="text-xs text-slate-500">{shop.salesCount} sales</span>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Activity (Invoices/Sales) */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle>Recent Activity Stream</CardTitle>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {recentSales.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 font-medium">No recent activity recorded.</div>
                                ) : (
                                    recentSales.map(sale => (
                                        <SaleDetailsDialog key={sale.id} sale={sale}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-all group border-b border-slate-100 last:border-0 border-l-4 border-l-transparent hover:border-l-blue-600">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <ShoppingCart size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                                {sale.shop.name}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none bg-slate-100 px-1.5 py-0.5 rounded">
                                                                #{sale.number}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {sale.items.map((item: any) => (
                                                                <span key={item.id} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                                                    {item.product.name} ×{item.quantity}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 mt-4 sm:mt-0 ml-16 sm:ml-0">
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-slate-900">${Number(sale.total).toFixed(2)}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">{new Date(sale.date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>

                {/* Side Stats */}
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Health</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database Status</span>
                                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    ONLINE
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Load Balanced Terminals</span>
                                    <span className="text-sm font-black text-slate-900">{totalShops}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Link href="/admin/inventory" className="p-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex flex-col gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <Package size={20} />
                        </div>
                        <div>
                            <div className="font-black text-xl mb-1 group-hover:translate-x-1 transition-transform">Inventory Matrix →</div>
                            <p className="text-xs text-slate-400 font-medium">Deep dive into current asset distribution and stock levels.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}

