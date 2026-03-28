import { prisma } from '@/lib/prisma';
import { Target, Zap, Activity, Map as MapIcon } from 'lucide-react';
import MapPageClient from '@/components/MapPageClient';
import { sanitizeData } from '@/lib/utils';
import { getBusinessFilter } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
    const filter = await getBusinessFilter();

    const [shops, warehouses, suppliers] = await Promise.all([
        prisma.shop.findMany({
            where: filter as any,
            select: { id: true, name: true, latitude: true, longitude: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.warehouse.findMany({
            where: filter as any,
            select: { id: true, name: true, latitude: true, longitude: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.supplier.findMany({
            where: filter as any,
            select: { id: true, name: true, latitude: true, longitude: true, email: true },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const locations = [
        ...shops.map(s => ({ ...s, type: 'shop' as const })),
        ...warehouses.map(w => ({ ...w, type: 'warehouse' as const })),
        ...suppliers.map(sup => ({ ...sup, type: 'supplier' as const }))
    ];

    const serializedLocations = sanitizeData(locations);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-6 fade-in overflow-hidden max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <MapIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Global Asset Map</h1>
                        <p className="text-sm text-slate-400 font-medium">Enterprise network location mapping</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                        {locations.length} Connected Nodes
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative">
                <MapPageClient
                    initialLocations={serializedLocations}
                    shopsCount={shops.length}
                    warehousesCount={warehouses.length}
                    suppliersCount={suppliers.length}
                    recentShops={shops.slice(0, 5)}
                    recentWarehouses={warehouses.slice(0, 5)}
                    recentSuppliers={suppliers.slice(0, 5)}
                />
            </div>
        </div>
    );
}
