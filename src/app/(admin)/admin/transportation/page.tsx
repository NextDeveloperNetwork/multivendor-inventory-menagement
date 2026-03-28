import { prisma } from '@/lib/prisma';
import LogisticsClient from '@/components/LogisticsClient';
import { sanitizeData } from '@/lib/utils';
import { getBusinessFilter } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function TransportationPage() {
    const filter = await getBusinessFilter();

    const [transfers, shops, warehouses, transporters] = await Promise.all([
        (prisma.transfer as any).findMany({
            where: {
                ...filter as any,
                // We show all transfers in the logistics page, especially those that need assignment or are in transit
            },
            include: {
                fromShop: true,
                fromWarehouse: true,
                toShop: true,
                toWarehouse: true,
                transporter: true
            },
            orderBy: { date: 'desc' }
        }),
        prisma.shop.findMany({ where: filter as any }),
        prisma.warehouse.findMany({ where: filter as any }),
        (prisma.user as any).findMany({
            where: { role: 'TRANSPORTER' as any },
            orderBy: { name: 'asc' }
        })
    ]);

    const locations = [
        ...shops.map(s => ({ ...s, id: `shop-${s.id}` })),
        ...warehouses.map(w => ({ ...w, id: `warehouse-${w.id}` }))
    ];

    return (
        <LogisticsClient 
            transfers={sanitizeData(transfers)} 
            locations={sanitizeData(locations)}
            transporters={sanitizeData(transporters)}
        />
    );
}
