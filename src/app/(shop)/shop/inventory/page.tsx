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
                product: {
                    include: {
                        category: true,
                        unit: true
                    }
                },
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

    // New variables for the updated header
    const uniqueAssets = inventory.length;
    const totalUnits = totalItems;
    const stockValue = totalValue;

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="flex items-center gap-6">
                        <Link href="/shop" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-black/10 group">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight uppercase leading-tight">
                                Store <span className="text-indigo-600">Inventory</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time management of products available at this location</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:w-auto">
                        <div className="bg-slate-50 px-8 py-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Product Types</span>
                            <span className="text-3xl font-bold text-slate-900 tracking-tighter font-mono">{uniqueAssets}</span>
                        </div>
                        <div className="bg-slate-50 px-8 py-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Units</span>
                            <span className="text-3xl font-bold text-slate-900 tracking-tighter font-mono">{totalUnits}</span>
                        </div>
                        <div className="bg-indigo-600 px-8 py-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col items-end text-white min-w-[220px]">
                            <span className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">Inventory Value</span>
                            <span className="text-3xl font-bold tracking-tighter font-mono">{symbol}{stockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Inventory Component */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <ShopInventoryClient inventory={inventory} currency={{ symbol, rate }} />
            </div>
        </div>
    );
}
