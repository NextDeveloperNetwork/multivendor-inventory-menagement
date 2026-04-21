import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getInventoryRequests } from '@/app/actions/salesOps';
import { getBusinessFilter } from '@/app/actions/business';
import { prisma } from '@/lib/prisma';
import { sanitizeData } from '@/lib/utils';
import RequestsClient from '@/components/RequestsClient';

export const dynamic = 'force-dynamic';

export default async function SalesRequestsPage() {
    const session = await getServerSession(authOptions);
    const businessFilter = await getBusinessFilter();

    const [rawRequests, rawProducts] = await Promise.all([
        getInventoryRequests(),
        (prisma as any).product.findMany({
            where: { ...businessFilter },
            orderBy: { name: 'asc' },
        }),
    ]);

    const requests = sanitizeData(rawRequests) as any[];
    const products = sanitizeData(rawProducts) as any[];

    return (
        <RequestsClient
            initialRequests={requests}
            products={products}
            userName={session?.user?.name || 'Manager'}
        />
    );
}
