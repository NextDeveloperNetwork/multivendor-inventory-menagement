import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign, AlertTriangle, ShoppingCart, TruckIcon, MapPin, Search } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatDateTime, sanitizeData } from '@/lib/utils';
import ShopDetailFilters from '@/components/ShopDetailFilters';
import DeleteSaleButton from '@/components/DeleteSaleButton';
import SaleDetailsDialog from '@/components/SaleDetailsDialog';
import TransferDetailsDialog from '@/components/TransferDetailsDialog';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';

interface ShopDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
    }>
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
            },
            inventory: {
                include: {
                    product: true,
                },
                orderBy: {
                    quantity: 'asc',
                },
            },
            transfersFrom: {
                where: dateFilter,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    toShop: true,
                    toWarehouse: true,
                },
                orderBy: {
                    date: 'desc',
                },
            },
            transfersTo: {
                where: dateFilter,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    fromShop: true,
                    fromWarehouse: true,
                },
                orderBy: {
                    date: 'desc',
                },
            },
        } as any,
    });

    if (!rawShop) {
        notFound();
    }

    const shop = sanitizeData(rawShop);

    if (!shop) {
        notFound();
    }

    // Combine and sort transfers
    const transfers = [...(shop.transfersFrom || []), ...(shop.transfersTo || [])].sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalRevenue = (shop.sales || []).reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const lowStockItems = (shop.inventory || []).filter((inv: any) => inv.quantity < 10);
    const totalInventoryValue = (shop.inventory || []).reduce((sum: number, inv: any) =>
        sum + (inv.quantity * Number(inv.product?.price || 0)), 0
    );

    return (
        <div className="space-y-10 fade-in pb-12">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-500/10 via-blue-900/50 to-transparent border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 group active:scale-95">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-black tracking-tight text-blue-500 uppercase">
                                    {shop.name}
                                </h1>
                                <span className="px-3 py-1 rounded-lg bg-white text-green-400 text-[10px] font-black tracking-widest uppercase border border-green-500/20">
                                    Operational
                                </span>
                            </div>
                            <p className="text-gray-600 flex items-center gap-2 text-sm">
                                <MapPin size={14} className="text-indigo-600" />
                                {shop.location || 'GLOBAL REACH'}
                            </p>
                        </div>
                    </div>
                    <ShopDetailFilters shopId={id} />
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-indigo-500/20">
                    <CardContent className="pt-6">
                        <CardValue value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend="Total Revenue" trendUp={true} />
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20">
                    <CardContent className="pt-6">
                        <CardValue value={shop.sales.length} icon={ShoppingCart} trend="Transactions" trendUp={true} />
                    </CardContent>
                </Card>

                <Card className="border-purple-500/20">
                    <CardContent className="pt-6">
                        <CardValue value={shop.inventory.length} icon={Package} trend="Catalog Size" />
                    </CardContent>
                </Card>

                <Card className={lowStockItems.length > 0 ? "border-rose-500/40 bg-rose-500/5" : "border-slate-500/20"}>
                    <CardContent className="pt-6">
                        <CardValue value={lowStockItems.length} icon={AlertTriangle} trendUp={false} />
                        <div className={`text-xs font-bold mt-1 ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                            {lowStockItems.length > 0 ? 'REPLENISHMENT CRITICAL' : 'Stock Levels Optimal'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sale Stream */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <ShoppingCart size={20} />
                            </div>
                            <CardTitle>Session History</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {shop.sales.length === 0 ? (
                            <div className="p-16 text-center text-gray-500 font-medium tracking-tight">V0.0 - No activity recorded</div>
                        ) : (
                            shop.sales.slice(0, 15).map((sale: any) => (
                                <SaleDetailsDialog key={sale.id} sale={{ ...sale, shop }}>
                                    <div className="p-5 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                                                    <DollarSign size={20} className="text-gray-400 group-hover:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-white">${Number(sale.total).toFixed(2)}</div>
                                                    <div className="text-[10px] text-indigo-400/60 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                        #{sale.number || sale.id.slice(-6).toUpperCase()} • {formatDateTime(sale.date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-xs font-bold text-white/80">{sale.user.name}</div>
                                                    <div className="text-[10px] text-gray-500">{sale.items.length} positions</div>
                                                </div>
                                                <DeleteSaleButton id={sale.id} />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-1.5 pl-16">
                                            {sale.items.map((item: any) => (
                                                <span key={item.id} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400 uppercase">
                                                    {item.product.name} ×{item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </SaleDetailsDialog>
                            ))
                        )}
                    </div>
                </Card>

                {/* Stock Matrix */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <Package size={20} />
                            </div>
                            <CardTitle>Inventory Matrix</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {shop.inventory.length === 0 ? (
                            <div className="p-16 text-center text-gray-500 font-medium">Empty Cluster</div>
                        ) : (
                            shop.inventory.map((item: any) => (
                                <div key={item.id} className="p-5 hover:bg-white/[0.02] transition-colors group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.quantity < 10 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-gray-400'
                                            }`}>
                                            <Package size={22} />
                                        </div>
                                        <div>
                                            <div className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase text-sm tracking-tight">{item.product.name}</div>
                                            <div className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {item.product.sku} • SRP: ${Number(item.product.price).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-black ${item.quantity < 10 ? 'text-rose-400' : 'text-white'}`}>{item.quantity}</div>
                                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Available</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Logistics View */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <TruckIcon size={20} />
                            </div>
                            <CardTitle>Logistics Routing</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-black">ID / Status</th>
                                    <th className="px-6 py-4 font-black">Routing</th>
                                    <th className="px-6 py-4 font-black">Loadout</th>
                                    <th className="px-6 py-4 font-black text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium italic uppercase tracking-widest text-[10px]">Registry Stream Inactive</td>
                                    </tr>
                                ) : (
                                    transfers.map((transfer: any) => (
                                        <TransferDetailsDialog key={transfer.id} transfer={transfer}>
                                            <tr className="hover:bg-white/[0.04] transition-all cursor-pointer group border-b border-white/5 active:scale-[0.99]">
                                                <td className="px-6 py-6">
                                                    <div className="font-mono text-[10px] text-blue-400 mb-1 font-black">#{transfer.id.slice(-8).toUpperCase()}</div>
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm ${transfer.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {transfer.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3 text-white/90 font-bold">
                                                        <span className="truncate max-w-[120px]">{transfer.fromShop?.name || transfer.fromWarehouse?.name}</span>
                                                        <ArrowRight size={14} className="text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                                                        <span className="truncate max-w-[120px]">{transfer.toShop?.name || transfer.toWarehouse?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-white/70">
                                                    <div className="font-black text-sm">{transfer.items.length} segments</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{transfer.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} Units</div>
                                                </td>
                                                <td className="px-6 py-6 text-right font-bold text-gray-400 group-hover:text-white transition-colors">
                                                    <div className="text-xs">{formatDateTime(transfer.date)}</div>
                                                    <div className="text-[8px] uppercase tracking-widest text-gray-600 mt-1 font-black font-mono">Synchronized</div>
                                                </td>
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

function ArrowRight({ size, className }: { size?: number, className?: string }) {
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
    )
}
