import { prisma } from '@/lib/prisma';
import { getBusinessFilter } from '@/app/actions/business';
import { sanitizeData } from '@/lib/utils';
import SalesManagerInputsClient from '@/components/SalesManagerInputsClient';

export const dynamic = 'force-dynamic';

export default async function SalesManagerInputsPage() {
    const filter = await getBusinessFilter();
    
    const [rawSales, baseCurrency] = await Promise.all([
        (prisma as any).sale.findMany({
            where: {
                ...filter,
                warehouseId: { not: null }
            },
            include: {
                warehouse: true,
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const sales = sanitizeData(rawSales);
    const currency = sanitizeData(baseCurrency) || { symbol: 'ALL' };

    return (
        <div className="max-w-5xl mx-auto px-1 md:px-0">
            <SalesManagerInputsClient initialSales={sales} currencySymbol={currency.symbol} />
        </div>
    );
}
