import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SimpleManagerDashboard from '@/components/SimpleManagerDashboard';

export const dynamic = 'force-dynamic';

export default async function ProductionManagerPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || user.role !== 'PRODUCTION_MANAGER') {
        redirect('/login');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // @ts-ignore
    const todaysLogs = await prisma.productionLog.findMany({
        where: {
            workerId: user.id,
            date: { gte: todayStart }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <SimpleManagerDashboard 
            user={{ id: user.id, name: user.name, role: user.role }} 
            todaysLogsData={todaysLogs} 
        />
    );
}
