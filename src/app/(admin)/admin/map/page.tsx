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
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
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
    );
}
