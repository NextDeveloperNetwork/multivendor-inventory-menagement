import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign, AlertTriangle, ShoppingCart, TruckIcon, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatDateTime, sanitizeData } from '@/lib/utils';
import ShopDetailFilters from '@/components/ShopDetailFilters';
import DeleteSaleButton from '@/components/DeleteSaleButton';
import SaleDetailsDialog from '@/components/SaleDetailsDialog';
import TransferDetailsDialog from '@/components/TransferDetailsDialog';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';

interface ShopDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function ShopDetailPage({ params, searchParams }: ShopDetailPageProps) {
    const { id } = await params;
    const sParams = await searchParams;
    const { startDate, endDate } = sParams;

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

    const rawShop = await prisma.shop.findUnique({
        where: { id },
        include: {
            sales: {
                where: dateFilter,
                include: { items: { include: { product: true } }, user: true },
                orderBy: { date: 'desc' },
            },
            inventory: { include: { product: true }, orderBy: { quantity: 'asc' } },
            transfersFrom: {
                where: dateFilter,
                include: { items: { include: { product: true } }, toShop: true, toWarehouse: true },
                orderBy: { date: 'desc' },
            },
            transfersTo: {
                where: dateFilter,
                include: { items: { include: { product: true } }, fromShop: true, fromWarehouse: true },
                orderBy: { date: 'desc' },
            },
        } as any,
    });

    if (!rawShop) notFound();
    const shop = sanitizeData(rawShop);
    if (!shop) notFound();

    const transfers = [...(shop.transfersFrom || []), ...(shop.transfersTo || [])].sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalRevenue = (shop.sales || []).reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const lowStockItems = (shop.inventory || []).filter((inv: any) => inv.quantity < 10);
    const totalInventoryValue = (shop.inventory || []).reduce(
        (sum: number, inv: any) => sum + inv.quantity * Number(inv.product?.price || 0),
        0
    );

    return (
        <div className="space-y-12 pb-12 px-4 md:px-8 lg:px-16">

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/admin"
                            className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-transform duration-200 active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight">{shop.name}</h1>
                            <p className="flex items-center gap-2 mt-2 text-sm text-white/80">
                                <MapPin size={14} /> {shop.location || 'GLOBAL REACH'}
                            </p>
                        </div>
                    </div>
                    <ShopDetailFilters shopId={id} />
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/5 backdrop-blur-md hover:scale-105 transition-transform">
                    <CardContent className="pt-6">
                        <CardValue value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend="Revenue" trendUp />
                    </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-md hover:scale-105 transition-transform">
                    <CardContent className="pt-6">
                        <CardValue value={shop.sales.length} icon={ShoppingCart} trend="Transactions" trendUp />
                    </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-md hover:scale-105 transition-transform">
                    <CardContent className="pt-6">
                        <CardValue value={shop.inventory.length} icon={Package} trend="Catalog Size" />
                    </CardContent>
                </Card>
                <Card className={`bg-white/5 backdrop-blur-md hover:scale-105 transition-transform ${lowStockItems.length > 0 ? 'border-rose-400 border' : ''}`}>
                    <CardContent className="pt-6">
                        <CardValue value={lowStockItems.length} icon={AlertTriangle} trendUp={false} />
                        <p className={`mt-1 text-xs font-bold ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-white/70'}`}>
                            {lowStockItems.length > 0 ? 'Low Stock Alert' : 'Stock Optimal'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Sale Stream */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <ShoppingCart size={20} />
                            </div>
                            <CardTitle>Session History</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="divide-y divide-blue-500/5 max-h-[600px] overflow-y-auto">
                        {shop.sales.length === 0 ? (
                            <div className="p-16 text-center text-black/60 font-medium">No activity recorded</div>
                        ) : (
                            shop.sales.slice(0, 15).map((sale: any) => (
                                <SaleDetailsDialog key={sale.id} sale={{ ...sale, shop }}>
                                    <div className="p-5 hover:bg-blue-500/10 transition-colors cursor-pointer rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                                <DollarSign size={20} className="text-black/70" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-bold">${Number(sale.total).toFixed(2)}</div>
                                                <div className="text-xs text-black/60 mt-1">
                                                    #{sale.number || sale.id.slice(-6).toUpperCase()} • {formatDateTime(sale.date)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-sm font-semibold text-black/80">{sale.user.name}</div>
                                                <div className="text-xs text-black/50">{sale.items.length} items</div>
                                            </div>
                                            <DeleteSaleButton id={sale.id} />
                                        </div>
                                    </div>
                                </SaleDetailsDialog>
                            ))
                        )}
                    </div>
                </Card>

                {/* Inventory */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                                <Package size={20} />
                            </div>
                            <CardTitle>Inventory Matrix</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="divide-y divide-blue-500/5 max-h-[600px] overflow-y-auto">
                        {shop.inventory.length === 0 ? (
                            <div className="p-16 text-center text-black/60 font-medium">No inventory items</div>
                        ) : (
                            shop.inventory.map((item: any) => (
                                <div key={item.id} className="p-5 hover:bg-blue-500/10 transition-colors rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.quantity < 10 ? 'bg-rose-500/20 text-rose-500' : 'bg-yellow-500/10 text-orange-500/70'
                                                }`}
                                        >
                                            <Package size={22} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-black">{item.product.name}</div>
                                            <div className="text-xs text-black/50 mt-1">ID: {item.product.sku} • ${Number(item.product.price).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${item.quantity < 10 ? 'text-rose-500' : 'text-black'}`}>{item.quantity}</div>
                                        <div className="text-[8px] text-black/50 uppercase tracking-wide mt-1">Available</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Transfers */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <TruckIcon size={20} />
                            </div>
                            <CardTitle>Logistics Routing</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-black/80">
                            <thead className="text-xs uppercase tracking-wide bg-white/10 text-black/50 border-b border-white/20">
                                <tr>
                                    <th className="px-6 py-3">ID / Status</th>
                                    <th className="px-6 py-3">Routing</th>
                                    <th className="px-6 py-3">Loadout</th>
                                    <th className="px-6 py-3 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-500/10">
                                {transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-black/50 font-medium italic">
                                            No transfers recorded
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.map((transfer: any) => (
                                        <TransferDetailsDialog key={transfer.id} transfer={transfer}>
                                            <tr className="hover:bg-blue-500/10 transition-colors cursor-pointer rounded-lg">
                                                <td className="px-6 py-4 font-mono text-xs">
                                                    #{transfer.id.slice(-8).toUpperCase()}<br />
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${transfer.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {transfer.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transfer.fromShop?.name || transfer.fromWarehouse?.name} → {transfer.toShop?.name || transfer.toWarehouse?.name}
                                                </td>
                                                <td className="px-6 py-4">{transfer.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} Units</td>
                                                <td className="px-6 py-4 text-right text-xs">{formatDateTime(transfer.date)}</td>
                                            </tr>
                                        </TransferDetailsDialog>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ArrowRight({ size, className }: { size?: number; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
