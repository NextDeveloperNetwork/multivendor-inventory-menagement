'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from './intelligence';

export async function logProduction({
    businessId,
    workerId,
    orderId,
    articleName,
    procName,
    isFinal,
    quantity,
    date,
    bomDeductions,
    isManager = false
}: {
    businessId?: string;
    workerId: string;
    orderId: string;
    articleName: string;
    procName: string;
    isFinal: boolean;
    quantity: number;
    date?: string;
    bomDeductions?: { accessoryId: string, totalNeeded: number }[];
    isManager?: boolean;
}) {
    try {
        const created = await prisma.productionLog.create({
            data: {
                businessId: businessId || null,
                workerId,
                orderId,
                articleName,
                procName,
                isFinal,
                isManager,
                quantity,
                date: date ? new Date(date) : new Date()
            }
        });


        if (bomDeductions && bomDeductions.length > 0) {
            for (const bomItem of bomDeductions) {
                await prisma.productionArticle.update({
                    where: { id: bomItem.accessoryId },
                    data: { stockQuantity: { decrement: bomItem.totalNeeded } }
                });
            }
        }

        revalidatePath('/admin/production/roster');
        return { success: true, id: created.id };

    } catch (error) {
        console.error('Failed to log production:', error);
        return { success: false, error: 'Failed to record yield in database.' };
    }
}

export async function getProductionLogs(businessId?: string) {
    return await prisma.productionLog.findMany({
        where: businessId ? { businessId } : {},
        orderBy: { date: 'desc' }
    });
}

export async function clearProductionLogs(businessId?: string) {
    try {
        await prisma.productionLog.deleteMany({
            where: {
                ...(businessId ? { businessId } : {}),
                isManager: false
            }
        });
        revalidatePath('/admin/production/roster');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function resetShiftLogs(date: string, businessId?: string) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const deleted = await prisma.productionLog.deleteMany({
            where: {
                ...(businessId ? { businessId } : {}),
                isManager: false,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        await logActivity({
            action: 'SHIFT_RESET',
            entityType: 'PRODUCTION',
            entityId: date,
            details: `Shift reset for ${date} — ${deleted.count} log(s) removed`
        });

        revalidatePath('/admin/production/roster');
        revalidatePath('/admin/production/tracking');
        return { success: true, deleted: deleted.count };
    } catch (error) {
        console.error('Shift reset failed:', error);
        return { success: false, error: 'Failed to reset shift data.' };
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
        // 1. Record the Log
        const log = await prisma.productionLog.create({
            data: {
                businessId: data.businessId || null,
                workerId: data.workerId,
                articleName: data.articleName,
                isFinal: true,
                isManager: true,
                procName: 'FINISHED_GOODS',
                orderId: 'MANUAL',
                quantity: data.quantity,
                boxes: data.boxes,
                date: data.date ? new Date(data.date) : new Date()
            }
        });

        // 2. Audit Trail
        await logActivity({
            action: 'PRODUCTION_LOGGED',
            entityType: 'PRODUCTION',
            entityId: log.id,
            details: `Produced ${data.quantity} units of ${data.articleName} (${data.boxes} boxes)`,
            userId: data.workerId
        });

        // 2. Automate Inventory Deduction (BOM)
        const article = await prisma.productionArticle.findFirst({
            where: { 
                name: data.articleName,
                businessId: data.businessId || null,
                isManager: true
            },
            include: { bom: true }
        });

        if (article) {
            // Deduct accessories from stock
            for (const bomItem of article.bom) {
                const totalNeeded = bomItem.usageQuantity * data.quantity;
                await prisma.productionArticle.update({
                    where: { id: bomItem.accessoryId },
                    data: {
                        stockQuantity: {
                            decrement: totalNeeded
                        }
                    }
                });
            }

            // Optionally increase the finished good's own stock if it's tracked
            await prisma.productionArticle.update({
                where: { id: article.id },
                data: {
                    stockQuantity: {
                        increment: data.quantity
                    }
                }
            });
        }

        revalidatePath('/production');
        revalidatePath('/admin/production/inventory');
        return { success: true };
    } catch (error) {
        console.error('Production logging error:', error);
        return { success: false, error: 'Failed to record daily production and update inventory.' };
    }
}

export async function deleteProductionLog(id: string) {
    try {
        await prisma.productionLog.delete({
            where: { id }
        });

        await logActivity({
            action: 'PRODUCTION_REMOVED',
            entityType: 'PRODUCTION',
            entityId: id,
            details: 'A factory production log entry was manually deleted'
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
                isManager: true,
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
                isManager: true,
                orderId: 'MANUAL',  // Only manager-dashboard entries (not Production Planner entries)
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
        const aggregations = await prisma.productionLog.aggregate({
            where: { 
                articleName,
                isFinal: true,
                ...(businessId ? { businessId } : {})
            },
            _sum: {
                quantity: true
            }
        });
        return aggregations._sum?.quantity || 0;
    } catch (error) {
        console.error('Failed to fetch cumulative yield:', error);
        return 0;
    }
}
