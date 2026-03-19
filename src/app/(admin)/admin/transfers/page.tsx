import { prisma } from '@/lib/prisma';
import TransferClient from '../../../../components/TransferClient';
import { TruckIcon, Package, Calendar } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

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

    const businessFilter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();

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

    const [rawTransfers, rawProducts, rawShops, rawWarehouses] = await Promise.all([
        prisma.transfer.findMany({
            where: { ...businessFilter, ...dateFilter } as any,
            include: {
                items: { include: { product: true } },
                fromWarehouse: true,
                fromShop: true,
                toWarehouse: true,
                toShop: true,
            } as any,
            orderBy: { date: 'desc' },
        }),
        prisma.product.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
    ]);

    const rawInventory = await prisma.inventory.findMany({
        where: businessFilter ? {
            OR: [
                { shop: businessFilter as any },
                { warehouse: businessFilter as any }
            ]
        } : {},
        include: { product: true }
    });

    const transfers = sanitizeData(rawTransfers);
    const products = sanitizeData(rawProducts);
    const shops = sanitizeData(rawShops);
    const warehouses = sanitizeData(rawWarehouses);
    const inventory = sanitizeData(rawInventory);

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Stock <span className="text-blue-600">Transfers</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Internal Inventory Movement & Location Synchronization
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'TOTAL TRANSFERS', value: transfers.length, icon: TruckIcon, sub: 'Active Movement Logs' },
                    { label: 'TODAY\'S ACTIVITY', value: transfers.filter((t: any) => new Date(t.date).toDateString() === new Date().toDateString()).length, icon: Calendar, sub: 'Current Business Cycle' },
                    { label: 'STOCK VOLUME', value: transfers.reduce((sum: number, t: any) => sum + t.items.reduce((is: number, i: any) => is + i.quantity, 0), 0).toLocaleString(), icon: Package, sub: 'Net Unit Throughput' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-600 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[8px] font-black text-slate-300 group-hover:text-blue-600 transition-colors uppercase tracking-widest font-mono">STEP // 0{idx + 1}</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1 tracking-tighter italic">{stat.value}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{stat.label}</div>
                    </div>
                ))}
            </div>

            <TransferClient
                transfers={transfers}
                products={products}
                shops={shops}
                warehouses={warehouses}
                inventory={inventory}
                selectedBusinessId={selectedBusinessId}
            />
        </div>
    );
}
