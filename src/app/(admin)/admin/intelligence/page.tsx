import { prisma } from '@/lib/prisma';
import IntelligenceClient from '@/components/IntelligenceClient';
import { getProfitAnalytics, getStockPredictions } from '@/app/actions/intelligence';
import { getBusinessFilter } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function IntelligencePage() {
    const filter = await getBusinessFilter();
    const shops = await prisma.shop.findMany({
        where: filter as any
    });
    const analytics = await getProfitAnalytics();

    // Get activity logs
    const activities = await (prisma as any).activityLog.findMany({
        where: filter as any,
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const baseCurrency = await prisma.currency.findFirst({ where: { isBase: true } });

    // Get predictions for the first shop by default
    const firstShopPredictions = shops.length > 0 ? await getStockPredictions(shops[0].id) : [];

    return (
        <IntelligenceClient
            initialAnalytics={analytics}
            initialActivities={activities}
            shops={shops}
            initialPredictions={firstShopPredictions}
            baseCurrencySymbol={baseCurrency?.symbol || '$'}
        />
    );
}
