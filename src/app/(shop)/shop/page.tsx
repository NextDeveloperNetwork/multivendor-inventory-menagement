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
                    <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight uppercase">Access <span className="text-rose-600">Verification</span></h1>
                    <p className="text-slate-500 mb-12 text-xl leading-relaxed font-medium">
                        Your account is pending shop assignment. A store administrator must link your profile to a specific commercial location.
                    </p>
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center justify-between">
                        <span>User Identity</span>
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
        <div className="min-h-screen bg-white pb-24 space-y-12 animate-in fade-in duration-700">
            {/* Store Header */}
            <div className="relative overflow-hidden bg-white rounded-[3rem] p-12 shadow-sm border border-slate-200 mx-4 md:mx-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/30 rounded-full -mr-64 -mt-64 blur-[100px] opacity-40"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <Activity size={12} className="text-indigo-600 animate-pulse" />
                                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Store Live</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-none">
                            Store <span className="text-indigo-600">Management</span> Overview
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                            Business Location: <span className="text-indigo-600 border-b border-indigo-200">{shop?.name || 'MAIN_STORE'}</span>
                            <span className="text-slate-300">|</span>
                            Active User: <span className="text-slate-900">{session.user.name}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-600 uppercase tracking-widest flex flex-col items-center shadow-sm">
                            <span className="text-slate-400 text-[8px] mb-1">Current Date</span>
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                        </div>
                        <Link href="/shop/pos" className="h-16 px-10 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg shadow-black/10 transition-all active:scale-[0.98] flex items-center gap-4 uppercase tracking-widest text-[10px] border border-slate-800 group">
                            <ShoppingCart size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" /> New Sale
                        </Link>
                    </div>
                </div>

                {/* Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 relative z-10">
                    <MetricCard 
                        label="Today's Revenue" 
                        value={`${symbol}${todaysSales.toLocaleString()}`} 
                        icon={TrendingUp} 
                        color="emerald" 
                        sub="Daily Sales Volume" 
                    />
                    <MetricCard 
                        label="Transactions" 
                        value={salesCount} 
                        icon={Activity} 
                        color="indigo" 
                        sub="Sales Conducted Today" 
                    />
                    <MetricCard 
                        label="Average Sale" 
                        value={`${symbol}${avgSale.toFixed(2)}`} 
                        icon={PieChart} 
                        color="indigo" 
                        sub="Value Per Ticket" 
                    />
                    <MetricCard 
                        label="Inventory Value" 
                        value={`${symbol}${stockValue.toLocaleString()}`} 
                        icon={Box} 
                        color="amber" 
                        sub="Total Asset Value" 
                    />
                </div>
            </div>

            {/* Application Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 md:px-0">

                {/* Secondary Actions Sidebar */}
                <div className="lg:col-span-1 space-y-10">
                    {/* Currency Exchange Registry */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <BarChart3 size={14} className="text-indigo-600" /> Currency Exchange Rates
                            </h3>
                            <div className="space-y-3">
                                {currencies.map((c: any) => {
                                    const relativeRate = Number(c.rate) / (Number(shop?.currency?.rate) || 1);
                                    return (
                                        <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-bold text-[9px] text-white group-hover:bg-indigo-600 transition-all">{c.code}</div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-slate-800">{c.name}</div>
                                                    <div className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">Base Rate</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold tracking-tight tabular-nums text-indigo-600">
                                                    1.00 = {c.symbol}{relativeRate.toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 italic">
                            <Target size={14} className="text-blue-600" /> Operational Shortcuts
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickActionLink href="/shop/inventory" icon={Package} label="Local Inventory" color="blue" />
                            <QuickActionLink href="/shop/history" icon={History} label="Audit Logs" color="amber" />
                            <QuickActionLink href="/shop/transfers" icon={TrendingUp} label="Asset Transfers" color="emerald" />
                            <QuickActionLink href="/admin" icon={Zap} label="Admin Console" color="indigo" />
                        </div>
                    </div>

                    {/* Low Stock Notifications */}
                    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Inventory Alerts</span>
                            </div>
                            <span className="bg-white/10 px-3 py-1 rounded-lg text-[9px] font-bold uppercase border border-white/5">{lowStockItems.length} ACTION REQUIRED</span>
                        </div>
                        <div className="p-4 divide-y divide-slate-100">
                            {lowStockItems.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-[9px] flex flex-col items-center gap-3 italic">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                                        <Star size={20} />
                                    </div>
                                    All Operations Nominal
                                </div>
                            ) : (
                                lowStockItems.map((item: any) => (
                                    <div key={item.id} className="py-4 flex items-center justify-between group px-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-100 italic font-black text-[10px]">SKU</div>
                                            <div>
                                                <div className="text-[11px] font-black text-slate-800 uppercase leading-none italic">{item.product.name}</div>
                                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{item.product.sku}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 font-mono italic ${item.quantity <= 0 ? 'bg-black text-white border-black' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                                                {item.quantity} UNITS
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sales Report */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                <BarChart3 size={16} className="text-indigo-600" /> Recent Sales Activity
                            </h3>
                            <Link href="/shop/history" className="text-[9px] font-bold text-indigo-600 bg-white px-5 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest border border-indigo-100 shadow-sm">
                                View Full Report
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5">Sale ID</th>
                                        <th className="px-6 py-5">Items Sold</th>
                                        <th className="px-6 py-5">Managed By</th>
                                        <th className="px-8 py-5 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentSales.map((sale: any) => (
                                        <tr key={sale.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter italic">REG_{sale.number}</span>
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
                                                        <Clock size={10} /> {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {sale.items.map((item: any) => (
                                                        <span key={item.id} className="px-2 py-1 bg-white text-[8px] font-black rounded-lg text-slate-500 uppercase tracking-widest border border-slate-100 group-hover:border-blue-200 group-hover:text-blue-600 transition-all italic">
                                                            {item.product.name} <span className="text-slate-300">×</span>{item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-white text-[9px] font-black italic">OP</div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{sale.user.name.split(' ')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="text-lg font-bold text-slate-900 tracking-tight tabular-nums group-hover:text-indigo-600 transition-colors">
                                                    {symbol}{(Number(sale.total) * (Number(shop?.currency?.rate) || 1)).toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {recentSales.length === 0 && (
                                <div className="p-20 text-center italic text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    No transaction entries recorded for this site
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub: string }) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
    };

    return (
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] group hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${colors[color] || 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <Icon size={20} />
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active</div>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
            <div className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">{sub}</div>
        </div>
    );
}

function QuickActionLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
    const colors: any = {
        blue: 'hover:bg-blue-600 hover:border-blue-600 text-blue-600',
        amber: 'hover:bg-amber-600 hover:border-amber-600 text-amber-600',
        emerald: 'hover:bg-emerald-600 hover:border-emerald-600 text-emerald-600',
        indigo: 'hover:bg-indigo-600 hover:border-indigo-600 text-indigo-600',
    };

    return (
        <Link href={href} className={`p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-4 group transition-all shadow-sm hover:shadow-xl hover:shadow-slate-500/10 ${colors[color]}`}>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Icon size={24} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest group-hover:text-white transition-colors text-center italic">{label}</span>
        </Link>
    );
}
