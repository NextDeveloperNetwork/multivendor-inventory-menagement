import { prisma } from '@/lib/prisma';
import TransferClient from '../../../../components/TransferClient';
import { TruckIcon, Package, Calendar, ArrowLeftRight } from 'lucide-react';
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

    const [rawTransfers, rawProducts, rawShops, rawWarehouses, rawInventory, rawTransporters, rawBaseCurrency] = await Promise.all([
        (prisma as any).transfer.findMany({
            where: { ...businessFilter, ...dateFilter } as any,
            include: {
                items: { include: { product: true } },
                fromWarehouse: true,
                fromShop: { include: { currency: true } },
                toWarehouse: true,
                toShop: { include: { currency: true } },
                transporter: true,
            },
            orderBy: { date: 'desc' },
        }),
        prisma.product.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.inventory.findMany({
            where: {
                ...businessFilter as any ? {
                    OR: [
                        { shop: { ...businessFilter as any } },
                        { warehouse: { ...businessFilter as any } }
                    ]
                } : {}
            },
            include: { product: true }
        }),
        (prisma as any).transporter.findMany({
            where: { ...businessFilter as any },
            orderBy: { name: 'asc' }
        }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const transfers = sanitizeData(rawTransfers);
    const products = sanitizeData(rawProducts);
    const shops = sanitizeData(rawShops);
    const warehouses = sanitizeData(rawWarehouses);
    const inventory = sanitizeData(rawInventory);
    const transporters = sanitizeData(rawTransporters);
    const baseCurrencySymbol = sanitizeData(rawBaseCurrency)?.symbol || 'ALL';

    const todayTransfers = transfers.filter((t: any) => new Date(t.date).toDateString() === new Date().toDateString()).length;
    const volume = transfers.reduce((sum: number, t: any) => sum + t.items.reduce((is: number, i: any) => is + i.quantity, 0), 0);

    const stats = [
        { label: 'Total Logs', value: transfers.length, icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: "Today's Activity", value: todayTransfers, icon: Calendar, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'Stock Volume', value: volume.toLocaleString(), icon: Package, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
    ];

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <TruckIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Stock Logistics</h1>
                        <p className="text-sm text-slate-400 font-medium">Internal movement tracking across the network</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 p-6">
                <TransferClient
                    transfers={transfers}
                    products={products}
                    shops={shops}
                    warehouses={warehouses}
                    inventory={inventory}
                    selectedBusinessId={selectedBusinessId}
                    transporters={transporters}
                    currencySymbol={baseCurrencySymbol}
                />
            </div>
        </div>
    );
}
