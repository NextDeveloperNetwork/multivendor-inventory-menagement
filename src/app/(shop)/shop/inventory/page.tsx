import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign, ShoppingCart } from 'lucide-react';
import ShopInventoryClient from '@/components/ShopInventoryClient';
import { sanitizeData } from '@/lib/utils';

export default async function ShopInventoryPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return <div className="p-12 text-center text-red-400">No shop assigned</div>;
    }

    const [rawInventory, shop] = await Promise.all([
        prisma.inventory.findMany({
            where: {
                shopId: session.user.shopId,
            },
            include: {
                product: true,
            },
            orderBy: {
                product: {
                    name: 'asc',
                },
            },
        }),
        prisma.shop.findUnique({
            where: { id: session.user.shopId },
            include: { currency: true }
        })
    ]);

    const inventory = sanitizeData(rawInventory);
    const rate = Number(shop?.currency?.rate) || 1;
    const symbol = shop?.currency?.symbol || '$';

    const totalValue = inventory.reduce((sum: number, item: any) =>
        sum + (item.quantity * Number(item.product.price) * rate), 0
    );
    const totalItems = inventory.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return (
        <div className="space-y-12 fade-in">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/shop" className="p-4 bg-white border border-blue-100 rounded-2xl hover:bg-blue-50 text-blue-500 transition-all shadow-sm">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                Shop Inventory
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Live snapshot of local stock holdings.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-purple-50 shadow-xl shadow-purple-500/5 flex items-center gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 relative z-10">
                        <Package size={32} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{inventory.length}</div>
                        <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mt-1">Unique Assets</div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-50/50 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-xl shadow-blue-500/5 flex items-center gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 relative z-10">
                        <ShoppingCart size={32} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{totalItems}</div>
                        <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mt-1">Total Units</div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-50 shadow-xl shadow-emerald-500/5 flex items-center gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 relative z-10">
                        <DollarSign size={32} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{symbol}{totalValue.toFixed(2)}</div>
                        <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mt-1">Stock Value</div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-50/50 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                </div>
            </div>

            {/* Main Inventory Component */}
            <ShopInventoryClient inventory={inventory} currency={{ symbol, rate }} />
        </div>
    );
}
