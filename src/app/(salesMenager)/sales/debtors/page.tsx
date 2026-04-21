import { prisma } from '@/lib/prisma';
import { getDebtors } from '@/app/actions/salesOps';
import { sanitizeData } from '@/lib/utils';
import DebtorsClient from '@/components/DebtorsClient';

export const dynamic = 'force-dynamic';

export default async function SalesDebtorsPage() {
    const [rawDebtors, baseCurrency] = await Promise.all([
        getDebtors(),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const currency = sanitizeData(baseCurrency) || { symbol: '$' };
    const currencySymbol = (currency as any).symbol || '$';

    // Serialize Prisma Decimal fields → plain numbers
    const debtors = (sanitizeData(rawDebtors) as any[]).map((d: any) => ({
        ...d,
        amount: Number(d.amount),
        paidAmount: Number(d.paidAmount),
        items: (d.items || []).map((item: any) => ({
            ...item,
            price: Number(item.price),
            total: Number(item.total),
        })),
    }));

    return (
        <DebtorsClient
            initialDebtors={debtors}
            currencySymbol={currencySymbol}
        />
    );
}
