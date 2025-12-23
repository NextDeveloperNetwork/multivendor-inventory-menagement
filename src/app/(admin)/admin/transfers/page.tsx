import { prisma } from '@/lib/prisma';
import TransferClient from '../../../../components/TransferClient';
import { TruckIcon, Package, Calendar } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

interface TransfersPageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        q?: string;
    }>
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
    const params = await searchParams;
    const { startDate, endDate, q } = params;

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

    const [rawTransfers, rawProducts, rawShops, rawWarehouses, rawInventory] = await Promise.all([
        prisma.transfer.findMany({
            where: dateFilter,
            include: {
                items: { include: { product: true } },
                fromWarehouse: true,
                fromShop: true,
                toWarehouse: true,
                toShop: true,
            } as any,
            orderBy: { date: 'desc' },
        }),
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        prisma.shop.findMany({ orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),
        prisma.inventory.findMany({ include: { product: true } })
    ]);

    const transfers = sanitizeData(rawTransfers);
    const products = sanitizeData(rawProducts);
    const shops = sanitizeData(rawShops);
    const warehouses = sanitizeData(rawWarehouses);
    const inventory = sanitizeData(rawInventory);

    return (
        <div className="space-y-12 fade-in relative pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Logistics <span className="text-blue-600">Vector</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            <TruckIcon size={20} className="text-blue-500" />
                            Coordinate Multi-Node Inventory Synchronization
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'TOTAL MOVEMENTS', value: transfers.length, icon: TruckIcon, sub: 'Active Flow Channels' },
                    { label: 'TODAY\'S TRANSFERS', value: transfers.filter((t: any) => new Date(t.date).toDateString() === new Date().toDateString()).length, icon: Calendar, sub: 'Current Cycle Activity' },
                    { label: 'VOLUME (UNITS)', value: transfers.reduce((sum: number, t: any) => sum + t.items.reduce((is: number, i: any) => is + i.quantity, 0), 0).toLocaleString(), icon: Package, sub: 'Net Resource Throughput' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-12 rounded-[2.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative group hover:bg-blue-50 transition-all duration-500">
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <stat.icon size={32} />
                            </div>
                            <span className="text-[10px] font-black text-blue-200 group-hover:text-blue-400 transition-colors uppercase tracking-widest font-mono">0{idx + 1} // LOGS</span>
                        </div>
                        <div className="text-4xl font-black text-black mb-2 tracking-tighter underline decoration-4 decoration-blue-500/10 underline-offset-8 group-hover:decoration-blue-500/30 transition-all">{stat.value}</div>
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-6">{stat.label}</div>
                    </div>
                ))}
            </div>

            <TransferClient
                transfers={transfers}
                products={products}
                shops={shops}
                warehouses={warehouses}
                inventory={inventory}
            />
        </div>
    );
}
