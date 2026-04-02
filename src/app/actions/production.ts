'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logProduction({
    businessId,
    workerId,
    orderId,
    articleName,
    procName,
    isFinal,
    quantity,
    date
}: {
    businessId?: string;
    workerId: string;
    orderId: string;
    articleName: string;
    procName: string;
    isFinal: boolean;
    quantity: number;
    date?: string;
}) {
    try {
        // @ts-ignore - Temporary bypass for Prisma generation lock on Windows
        await prisma.productionLog.create({
            data: {
                businessId: businessId || null,
                workerId,
                orderId,
                articleName,
                procName,
                isFinal,
                quantity,
                date: date ? new Date(date) : new Date()
            }
        });
        revalidatePath('/admin/production/roster');
        return { success: true };
    } catch (error) {
        console.error('Failed to log production:', error);
        return { success: false, error: 'Failed to record yield in database.' };
    }
}

export async function getProductionLogs(businessId?: string) {
    // @ts-ignore - Temporary bypass for Prisma generation lock on Windows
    return await prisma.productionLog.findMany({
        where: businessId ? { businessId } : {},
        orderBy: { date: 'desc' }
    });
}

export async function clearProductionLogs(businessId?: string) {
    try {
        // @ts-ignore - Temporary bypass for Prisma generation lock on Windows
        await prisma.productionLog.deleteMany({
            where: businessId ? { businessId } : {}
        });
        revalidatePath('/admin/production/roster');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function logDailyProduction(data: {
    businessId?: string;
    workerId: string;
    articleName: string;
    quantity: number;
    boxes: number;
    date?: string;
}) {
    try {
        // @ts-ignore
        await prisma.productionLog.create({
            data: {
                businessId: data.businessId || null,
                workerId: data.workerId,
                articleName: data.articleName,
                isFinal: true,
                procName: 'FINISHED_GOODS',
                orderId: 'MANUAL',
                quantity: data.quantity,
                boxes: data.boxes,
                date: data.date ? new Date(data.date) : new Date()
            }
        });
        revalidatePath('/production');
        revalidatePath('/admin/production/inventory');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to record daily production.' };
    }
}

export async function deleteProductionLog(id: string) {
    try {
        // @ts-ignore
        await prisma.productionLog.delete({
            where: { id }
        });
        revalidatePath('/admin/production/roster');
        revalidatePath('/admin/production/tracking');
        revalidatePath('/production');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete log entry.' };
    }
}

export async function getDailyProductionLogs(workerId: string, date: string) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // @ts-ignore
        return await prisma.productionLog.findMany({
            where: {
                workerId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return [];
    }
}
export async function getAdminDailyProductionLogs(businessId: string | undefined, date: string) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // @ts-ignore
        return await prisma.productionLog.findMany({
            where: {
                ...(businessId ? { businessId } : {}),
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Failed to fetch admin logs:', error);
        return [];
    }
}
export async function getArticleCumulativeYield(articleName: string, businessId?: string) {
    try {
        // @ts-ignore
        const aggregations = await prisma.productionLog.aggregate({
            where: { 
                articleName,
                ...(businessId ? { businessId } : {})
            },
            _sum: {
                quantity: true
            }
        });
        // @ts-ignore
        return aggregations._sum?.quantity || 0;
    } catch (error) {
        console.error('Failed to fetch cumulative yield:', error);
        return 0;
    }
}
