import { getFreeSales } from '@/app/actions/salesOps';
import FreeSalesClient from '@/components/FreeSalesClient';
import { sanitizeData } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminFreeSalesPage() {
    const [rawSales, baseCurrency, session] = await Promise.all([
        getFreeSales(),
        prisma.currency.findFirst({ where: { isBase: true } }),
        getServerSession(authOptions),
    ]);

    const currency = sanitizeData(baseCurrency) || { symbol: '$' };
    const currencySymbol = (currency as any).symbol || '$';

    // Serialize Prisma Decimal fields → plain numbers
    const sales = (sanitizeData(rawSales) as any[]).map((s: any) => ({
        ...s,
        totalAmount: Number(s.totalAmount),
        items: (s.items || []).map((item: any) => ({
            ...item,
            price: Number(item.price),
            total: Number(item.total),
        })),
    }));

    return (
        <div className="max-w-[1600px] mx-auto px-1 md:px-0">
            <FreeSalesClient
                initialSales={sales}
                userName={session?.user?.name || 'Admin'}
                currencySymbol={currencySymbol}
            />
        </div>
    );
}
