import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Package, DollarSign, ListOrdered } from 'lucide-react';
import ShopInventoryClient from '@/components/ShopInventoryClient';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ShopInventoryPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return <div className="p-12 text-center text-red-500 font-medium">No shop assigned</div>;
    }

    const [rawInventory, shop] = await Promise.all([
        prisma.inventory.findMany({
            where: { shopId: session.user.shopId },
            include: {
                product: { include: { category: true, unit: true } },
            },
            orderBy: { product: { name: 'asc' } },
        }),
        prisma.shop.findUnique({
            where: { id: session.user.shopId },
            include: { currency: true }
        })
    ]);

    const inventory = sanitizeData(rawInventory);
    const rate = Number(shop?.currency?.rate) || 1;
    const symbol = shop?.currency?.symbol || 'ALL';

    const totalValue = inventory.reduce((sum: number, item: any) =>
        sum + (item.quantity * Number(item.product.price) * rate), 0
    );
    const totalItems = inventory.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const stats = [
        { label: 'Total Products', value: inventory.length, icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Total Units', value: totalItems, icon: ListOrdered, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { label: 'Inventory Value', value: `${symbol} ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    ];

    return (
        <div className="space-y-6 fade-in">
            {/* Page Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Store Inventory</h1>
                        <p className="text-sm text-slate-400 font-medium">Real-time stock levels for this location</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Component */}
            <ShopInventoryClient inventory={inventory} currency={{ symbol, rate }} />
        </div>
    );
}
