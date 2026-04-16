import { prisma } from '@/lib/prisma';
import { getDebtors } from '@/app/actions/salesOps';
import SalesDebtorsClient from '@/components/SalesDebtorsClient';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminSalesDebtorsPage() {
    const [rawDebtors, baseCurrency] = await Promise.all([
        getDebtors(),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const debtors = sanitizeData(rawDebtors);
    const currency = sanitizeData(baseCurrency) || { symbol: 'ALL' };

    return (
        <div className="max-w-[1600px] mx-auto px-1 md:px-0">
            <SalesDebtorsClient initialDebtors={debtors} currencySymbol={currency.symbol} />
        </div>
    );
}
