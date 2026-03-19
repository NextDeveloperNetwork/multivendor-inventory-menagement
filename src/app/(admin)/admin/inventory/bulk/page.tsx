import { prisma } from '@/lib/prisma';
import { sanitizeData } from '@/lib/utils';
import { getSelectedBusinessId } from '@/app/actions/business';
import BulkAddClient from '@/components/BulkAddClient';

export default async function BulkAddPage() {
    const selectedBusinessId = await getSelectedBusinessId();
    const businessFilter = selectedBusinessId ? { businessId: selectedBusinessId } : {};

    const [shops, warehouses, categories, units] = await Promise.all([
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        (prisma as any).productCategory.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        (prisma as any).productUnit.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } })
    ]);

    return (
        <BulkAddClient
            selectedBusinessId={selectedBusinessId}
            shops={sanitizeData(shops)}
            warehouses={sanitizeData(warehouses)}
            categories={sanitizeData(categories)}
            units={sanitizeData(units)}
        />
    );
}
