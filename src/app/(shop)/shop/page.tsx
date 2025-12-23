import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Package, DollarSign, TrendingUp, ShoppingCart, Clock, Star, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardValue } from '@/components/DashboardCard';

export default async function ShopDashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-2xl max-w-lg">
                    <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <AlertTriangle className="text-rose-500" size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Assignment Pending</h1>
                    <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">
                        Your account is currently in a holding state. An administrator must assign you to a physical node before you can access terminal functions.
                    </p>
                    <div className="p-5 bg-slate-50 rounded-2xl text-[11px] text-slate-400 font-bold uppercase tracking-widest border border-slate-100 flex items-center justify-between">
                        <span>Identity Reference</span>
                        <span className="font-mono text-slate-600">{session?.user?.id?.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        );
    }

    const shopId = session.user.shopId;
    let inventoryCount = 0;
    let todaysSales = 0;
    let salesCount = 0;
    let recentSales: any[] = [];
    let lowStockItems: any[] = [];

    try {
        inventoryCount = await prisma.inventory.count({
            where: { shopId }
        });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const sales = await prisma.sale.findMany({
            where: {
                shopId,
                date: { gte: startOfDay }
            },
            include: { items: true }
        });

        salesCount = sales.length;
        todaysSales = sales.reduce((acc: number, sale: any) => acc + Number(sale.total), 0);

        recentSales = await prisma.sale.findMany({
            where: { shopId },
            orderBy: { date: 'desc' },
            take: 6,
            include: {
                items: { include: { product: true } },
                user: true
            }
        });

        lowStockItems = await prisma.inventory.findMany({
            where: {
                shopId,
                quantity: { lt: 10 }
            },
            orderBy: { quantity: 'asc' },
            take: 6,
            include: { product: true }
        });

    } catch (e) {
        console.log("DB Error or Empty", e);
    }

    const avgSaleValue = salesCount > 0 ? todaysSales / salesCount : 0;

    return (
        <div className="space-y-12 fade-in pb-20">
            {/* Page Header */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Terminal <span className="text-blue-600">Control</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                            <Zap size={18} className="text-blue-500" />
                            Logged in as <span className="text-black underline decoration-blue-500/30 underline-offset-4">{session.user.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-6 py-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-[11px] font-black text-blue-400 uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        <Link href="/shop/pos" className="h-16 px-8 bg-black text-white rounded-2xl font-bold shadow-xl shadow-blue-500/10 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center gap-3 uppercase tracking-widest text-xs border-2 border-black">
                            <ShoppingCart size={20} /> Open Register (POS)
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card>
                    <CardContent className="pt-10">
                        <CardValue
                            value={`$${todaysSales.toLocaleString()}`}
                            icon={DollarSign}
                            trend="Healthy"
                            trendUp={true}
                        />
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-6">Today's Revenue</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-10">
                        <CardValue
                            value={`$${avgSaleValue.toFixed(2)}`}
                            icon={TrendingUp}
                        />
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-6">Average Ticket</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-10">
                        <CardValue
                            value={inventoryCount}
                            icon={Package}
                        />
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-6">Local Stock Units</div>
                    </CardContent>
                </Card>

                <Card className={lowStockItems.length > 0 ? "border-red-100 bg-red-50/50" : ""}>
                    <CardContent className="pt-10">
                        <CardValue
                            value={lowStockItems.length}
                            icon={AlertTriangle}
                            trendUp={false}
                        />
                        <div className={`text-[10px] font-black mt-6 uppercase tracking-widest ${lowStockItems.length > 0 ? 'text-red-500' : 'text-blue-300'}`}>
                            {lowStockItems.length > 0 ? 'Replenish Required' : 'Supply Optimal'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Recent Activity */}
                <Card className="shadow-2xl shadow-blue-500/5 border-2 border-blue-50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-blue-50 bg-blue-50/30 p-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                <ShoppingCart size={24} />
                            </div>
                            <CardTitle className="text-black font-black text-2xl uppercase tracking-tighter italic">Recent Transactions</CardTitle>
                        </div>
                        <Link href="/shop/history" className="text-[10px] font-black text-blue-600 bg-white border border-blue-100 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
                            Full Registry
                        </Link>
                    </CardHeader>
                    <div className="divide-y-2 divide-blue-50">
                        {recentSales.map((sale: any) => (
                            <div key={sale.id} className="p-8 hover:bg-blue-50/30 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg font-black text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                            $
                                        </div>
                                        <div>
                                            <div className="font-black text-black text-2xl tracking-tighter underline decoration-2 decoration-blue-500/20 underline-offset-4">${Number(sale.total).toFixed(2)}</div>
                                            <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mt-2 opacity-60">
                                                {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // {sale.user.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black font-mono bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg text-blue-400 uppercase tracking-widest">
                                        TX-{sale.id.slice(-6).toUpperCase()}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-20">
                                    {sale.items.map((item: any) => (
                                        <div key={item.id} className="text-[10px] px-3 py-1.5 bg-white border border-blue-100 rounded-lg font-black text-black uppercase tracking-widest shadow-sm">
                                            {item.product.name} <span className="text-blue-600 ml-1">×{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Logistics Requirements */}
                <Card className="shadow-2xl shadow-blue-500/5 border-2 border-blue-50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-blue-50 bg-blue-50/30 p-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <CardTitle className="text-black font-black text-2xl uppercase tracking-tighter italic">Critical Alerts</CardTitle>
                        </div>
                        <Link href="/shop/inventory" className="text-[10px] font-black text-blue-300 bg-white border border-blue-100 px-5 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all uppercase tracking-widest">
                            Stock Manager
                        </Link>
                    </CardHeader>
                    <div className="divide-y-2 divide-blue-50">
                        {lowStockItems.length === 0 ? (
                            <div className="p-24 text-center space-y-8">
                                <div className="w-24 h-24 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm rotate-6">
                                    <Star className="text-blue-500" size={40} />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-black font-black text-2xl uppercase tracking-tighter">Optimal Registry</p>
                                    <p className="text-xs text-blue-300 font-bold uppercase tracking-widest leading-relaxed">System terminal diagnostics show no immediate stock depletion detected.</p>
                                </div>
                            </div>
                        ) : (
                            lowStockItems.map((item: any) => (
                                <div key={item.id} className="p-8 hover:bg-red-50/30 transition-all group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-16 h-16 border-2 rounded-2xl flex items-center justify-center transition-all ${item.quantity === 0 ? 'bg-red-500 text-white border-red-500' : 'bg-white text-orange-500 border-orange-100 shadow-sm'}`}>
                                                <Package size={32} />
                                            </div>
                                            <div>
                                                <div className="font-black text-black group-hover:text-blue-600 transition-colors uppercase tracking-tight text-lg italic">
                                                    {item.product.name}
                                                </div>
                                                <div className="text-[10px] text-blue-300 font-black font-mono mt-1.5 tracking-[0.2em] uppercase opacity-60">
                                                    SKU: {item.product.sku}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] font-black px-5 py-3 rounded-xl border shadow-xl ${item.quantity === 0
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-orange-600 border-orange-200'
                                                }`}>
                                                {item.quantity === 0 ? 'CRITICAL DEPLETION' : `${item.quantity} UNITS REMAINING`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
