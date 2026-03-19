import { prisma } from '@/lib/prisma';
import { sanitizeData } from '@/lib/utils';
import { getSelectedBusinessId } from '@/app/actions/business';
import NewProductClient from '@/components/NewProductClient';

export default async function NewProductPage() {
    const selectedBusinessId = await getSelectedBusinessId();
    const businessFilter = selectedBusinessId ? { businessId: selectedBusinessId } : {};

    const [baseCurrency, shops, warehouses, categories, units] = await Promise.all([
        prisma.currency.findFirst({ where: { isBase: true } }),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        (prisma as any).productCategory.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        (prisma as any).productUnit.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } })
    ]);

    const currency = sanitizeData(baseCurrency) || { symbol: '$', code: 'USD' };

    return (
        <NewProductClient
            selectedBusinessId={selectedBusinessId}
            currency={currency}
            shops={sanitizeData(shops)}
            warehouses={sanitizeData(warehouses)}
            categories={sanitizeData(categories)}
            units={sanitizeData(units)}
        />
    );
}
