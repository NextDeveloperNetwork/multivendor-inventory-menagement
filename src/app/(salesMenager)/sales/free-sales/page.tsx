import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFreeSales } from '@/app/actions/salesOps';
import FreeSalesClient from '@/components/FreeSalesClient';
import { prisma } from '@/lib/prisma';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function FreeSalesPage() {
    const session = await getServerSession(authOptions);
    const [rawSales, baseCurrency] = await Promise.all([
        getFreeSales(),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const currency = sanitizeData(baseCurrency) || { symbol: '$' };
    const currencySymbol = (currency as any).symbol || '$';

    // Serialize Decimal objects to plain numbers for Client Component compatibility
    const sales = (rawSales as any[]).map((sale: any) => ({
        ...sale,
        totalAmount: Number(sale.totalAmount),
        items: sale.items.map((item: any) => ({
            ...item,
            price: Number(item.price),
            total: Number(item.total)
        }))
    }));

    return (
        <FreeSalesClient 
            initialSales={sales} 
            userName={session?.user?.name || 'Manager'} 
            currencySymbol={currencySymbol}
        />
    );
}
