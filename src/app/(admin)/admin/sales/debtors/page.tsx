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

    const currency = sanitizeData(baseCurrency) || { symbol: 'ALL' };
    const currencySymbol = (currency as any).symbol || 'ALL';

    const debtors = (sanitizeData(rawDebtors) as any[]).map((d: any) => ({
        ...d,
        amount: Number(d.amount),
        paidAmount: Number(d.paidAmount),
        debtDate: d.debtDate ? new Date(d.debtDate).toISOString() : null,
        items: (d.items || []).map((item: any) => ({
            ...item,
            price: Number(item.price),
            total: Number(item.total),
        })),
    }));

    return (
        <div className="max-w-[1600px] mx-auto px-1 md:px-0">
            <SalesDebtorsClient initialDebtors={debtors} currencySymbol={currencySymbol} />
        </div>
    );
}
