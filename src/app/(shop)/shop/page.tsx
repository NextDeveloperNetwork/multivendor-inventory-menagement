import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
    AlertTriangle, Package, TrendingUp, ShoppingCart,
    Clock, Star, Activity, Box, BarChart3,
    History, ArrowLeftRight, Store
} from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ShopDashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-10 max-w-md text-center">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertTriangle className="text-rose-500" size={28} />
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 mb-2">No Shop Assigned</h1>
                    <p className="text-sm text-slate-500">Your account is not linked to a shop. Contact an administrator to assign you to a store location.</p>
                    <div className="mt-6 px-4 py-3 bg-slate-50 rounded-xl text-xs text-slate-400 font-mono">
                        User ID: {session?.user?.id?.slice(0, 16).toUpperCase()}
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
            prisma.shop.findUnique({ where: { id: shopId }, include: { currency: true } }),
            prisma.inventory.count({ where: { shopId } }),
            prisma.inventory.findMany({
                where: { shopId, quantity: { lt: 10 } },
                orderBy: { quantity: 'asc' },
                take: 8,
                include: { product: true }
            }),
            prisma.inventory.findMany({ where: { shopId }, include: { product: true } }),
            prisma.currency.findMany({ orderBy: { code: 'asc' } })
        ]);

        shop = shopData;
        inventoryCount = invCount;
        lowStockItems = lowStock;
        currencies = sanitizeData(currenciesRaw);

        const rate = Number(shop?.currency?.rate) || 1;
        stockValue = inventoryData.reduce((acc, inv) =>
            acc + (Number(inv.quantity) * Number(inv.product.price) * rate), 0);

        const salesRaw = await prisma.sale.findMany({
            where: { shopId, date: { gte: startOfDay } }
        });
        salesCount = salesRaw.length;
        todaysSales = salesRaw.reduce((acc: number, sale: any) => acc + Number(sale.total), 0);

        const recentSalesRaw = await prisma.sale.findMany({
            where: { shopId },
            orderBy: { date: 'desc' },
            take: 8,
            include: { items: { include: { product: true } }, user: true }
        });
        recentSales = sanitizeData(recentSalesRaw);
    } catch (e) {
        console.error('Shop dashboard error:', e);
    }

    const sym = shop?.currency?.symbol || 'ALL';
    const rate = Number(shop?.currency?.rate) || 1;
    const avgSale = salesCount > 0 ? todaysSales / salesCount : 0;

    const stats = [
        { label: "Today's Revenue",  value: `${sym} ${todaysSales.toLocaleString()}`, icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { label: 'Transactions',     value: salesCount,                                icon: Activity,     color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Avg. Sale',        value: `${sym} ${avgSale.toFixed(2)}`,           icon: BarChart3,    color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'Inventory Value',  value: `${sym} ${stockValue.toLocaleString()}`,  icon: Box,          color: 'text-amber-600 bg-amber-50 border-amber-100' },
    ];

    const quickLinks = [
        { href: '/shop/inventory', icon: Package,       label: 'Inventory',   color: 'text-blue-600' },
        { href: '/shop/history',   icon: History,       label: 'Sales History', color: 'text-amber-600' },
        { href: '/shop/transfers', icon: ArrowLeftRight, label: 'Transfers',  color: 'text-emerald-600' },
        { href: '/shop/pos',       icon: ShoppingCart,  label: 'POS',         color: 'text-indigo-600' },
    ];

    return (
        <div className="space-y-8 fade-in">

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Store size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{shop?.name || 'Store Dashboard'}</h1>
                        <p className="text-sm text-slate-400 font-medium">Welcome back, {session.user.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <Link
                        href="/shop/pos"
                        className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        <ShoppingCart size={16} /> New Sale
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column */}
                <div className="space-y-6">
                    {/* Quick Links */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickLinks.map(q => (
                                <Link key={q.href} href={q.href} className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all group shadow-sm hover:shadow-md">
                                    <q.icon size={20} className={`${q.color} group-hover:scale-110 transition-transform`} />
                                    <span className="text-xs font-semibold text-slate-600 text-center">{q.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                <h3 className="text-sm font-bold text-slate-900">Low Stock Alerts</h3>
                            </div>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                {lowStockItems.length} items
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-slate-300">
                                    <Star size={28} strokeWidth={1.2} className="mb-2" />
                                    <p className="text-xs font-medium text-slate-400">All stock levels nominal</p>
                                </div>
                            ) : (
                                lowStockItems.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between px-5 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{item.product.name}</p>
                                            <p className="text-xs text-slate-400">{item.product.sku}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                            item.quantity <= 0
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {item.quantity} units
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Currencies */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <BarChart3 size={13} className="text-indigo-600" /> Exchange Rates
                        </h3>
                        <div className="space-y-2">
                            {currencies.map((c: any) => {
                                const rel = Number(c.rate) / (Number(shop?.currency?.rate) || 1);
                                return (
                                    <div key={c.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[9px] font-bold">{c.code}</div>
                                            <span className="text-xs font-semibold text-slate-700">{c.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 tabular-nums">
                                            1 = {c.symbol}{rel.toFixed(4)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column — Recent Sales */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={13} className="text-indigo-600" /> Recent Sales
                            </h3>
                            <Link href="/shop/history" className="text-xs font-semibold text-indigo-600 hover:underline">
                                View all
                            </Link>
                        </div>
                        {recentSales.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-slate-300">
                                <ShoppingCart size={36} strokeWidth={1.2} className="mb-3" />
                                <p className="text-sm font-medium text-slate-400">No sales recorded yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentSales.map((sale: any) => (
                                    <div key={sale.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all group">
                                        <div className="w-9 h-9 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                            <ShoppingCart size={15} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900"># {sale.number}</p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {sale.items.map((i: any) => `${i.product.name} ×${i.quantity}`).join(', ')}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-slate-900">
                                                {sym} {(Number(sale.total) * rate).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                                                <Clock size={10} />
                                                {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
