import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SimpleManagerDashboard from '@/components/SimpleManagerDashboard';

import { getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function ProductionManagerPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || (user.role !== 'PRODUCTION_MANAGER' && user.role !== 'ADMIN' && user.role !== 'USER')) {
        redirect('/login');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { shop: true }
    });

    const selectedBusinessId = await getSelectedBusinessId();
    const businessId = selectedBusinessId || dbUser?.shop?.businessId || undefined;

    // @ts-ignore
    const todaysLogs = await prisma.productionLog.findMany({
        where: {
            workerId: user.id,
            businessId: businessId || null,
            date: { gte: todayStart }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <SimpleManagerDashboard 
            user={{ id: user.id, name: user.name, role: user.role, shopId: user.shopId }} 
            todaysLogsData={todaysLogs} 
            businessId={businessId}
        />
    );
}
