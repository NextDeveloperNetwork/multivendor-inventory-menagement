import { prisma } from '@/lib/prisma';
import IntelligenceClient from '@/components/IntelligenceClient';
import { getProfitAnalytics, getStockPredictions } from '@/app/actions/intelligence';

export const dynamic = 'force-dynamic';

export default async function IntelligencePage() {
    const shops = await prisma.shop.findMany();
    const analytics = await getProfitAnalytics();

    // Get activity logs
    const activities = await (prisma as any).activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    // Get predictions for the first shop by default
    const firstShopPredictions = shops.length > 0 ? await getStockPredictions((shops[0] as any).id) : [];

    return (
        <IntelligenceClient
            initialAnalytics={analytics}
            initialActivities={activities}
            shops={shops}
            initialPredictions={firstShopPredictions}
        />
    );
}
