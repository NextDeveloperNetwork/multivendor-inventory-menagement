'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProductionArticles(businessId?: string) {
    try {
        const articles = await prisma.productionArticle.findMany({
            where: businessId ? { businessId } : {},
            include: {
                processes: { orderBy: { sequence: 'asc' } },
                bom: true
            },
            orderBy: { name: 'asc' }
        });

        // Fetch yields for all articles in this business
        // @ts-ignore
        const yields = await prisma.productionLog.groupBy({
            by: ['articleName'],
            where: businessId ? { businessId } : {},
            _sum: {
                quantity: true
            }
        });

        const yieldMap = new Map(yields.map((y: any) => [y.articleName, y._sum.quantity || 0]));
        
        return articles.map(a => ({
            ...a,
            totalYield: yieldMap.get(a.name) || 0
        }));
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        return [];
    }
}

export async function syncProductionArticle(article: any) {
    try {
        const { id, processes = [], bom = [], businessId, ...data } = article;
        
        // Ensure entryDate is a Date object
        if (data.entryDate) data.entryDate = new Date(data.entryDate);
        
        // Handle unique field constraints (empty strings should be null)
        if (data.sku === '') data.sku = null;

        let savedArticle;
        // Check if we should update: must have an ID, and it shouldn't be a temporary 'art_' prefix
        if (id && id.length > 10 && !id.startsWith('art_')) {
            // Update existing
            savedArticle = await prisma.productionArticle.update({
                where: { id },
                data: {
                    ...data,
                    businessId: businessId || null,
                    processes: {
                        deleteMany: {},
                        create: processes.map((p: any) => ({
                            processName: p.processName,
                            unitsPerHour: Number(p.unitsPerHour),
                            sequence: Number(p.sequence)
                        }))
                    },
                    bom: {
                        deleteMany: {},
                        create: bom.map((b: any) => ({
                            accessoryId: b.accessoryId,
                            usageQuantity: Number(b.usageQuantity),
                            processName: b.processName
                        }))
                    }
                }
            });
        } else {
            // Create new
            savedArticle = await prisma.productionArticle.create({
                data: {
                    ...data,
                    businessId: businessId || null,
                    processes: {
                        create: processes.map((p: any) => ({
                            processName: p.processName,
                            unitsPerHour: Number(p.unitsPerHour),
                            sequence: Number(p.sequence)
                        }))
                    },
                    bom: {
                        create: bom.map((b: any) => ({
                            accessoryId: b.accessoryId,
                            usageQuantity: Number(b.usageQuantity),
                            processName: b.processName
                        }))
                    }
                }
            });
        }

        revalidatePath('/admin/production/manager-inventory');
        revalidatePath('/admin/production/inventory');
        revalidatePath('/production');
        return { success: true, id: savedArticle.id };
    } catch (error: any) {
        console.error('SYNC ARTICLE FAILED:', error);
        return { error: error.message };
    }
}

export const createProductionArticle = syncProductionArticle;

export async function bulkSyncProductionArticles(articles: any[], businessId?: string) {
    try {
        const results = [];
        for (const article of articles) {
            const res = await syncProductionArticle({ ...article, businessId });
            results.push(res);
        }
        
        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
            return { error: `Completed with ${errors.length} errors: ${errors[0]}`, success: errors.length < articles.length };
        }
        
        return { success: true };
    } catch (error: any) {
        console.error('BULK SYNC FATAL ERROR:', error);
        return { error: error.message };
    }
}

export async function deleteProductionArticle(id: string) {
    try {
        await prisma.productionArticle.delete({ where: { id } });
        revalidatePath('/admin/production/inventory');
        revalidatePath('/production');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to delete article' };
    }
}

/* --- Global Processes --- */
export async function getProductionProcesses(businessId?: string) {
    return await prisma.productionProcess.findMany({
        where: businessId ? { businessId } : {},
        orderBy: { name: 'asc' }
    });
}

export async function syncProductionProcess(process: any) {
    try {
        const { id, name, requiresMachine, businessId } = process;
        if (id && id.length > 5) {
            await prisma.productionProcess.update({
                where: { id },
                data: { name, requiresMachine, businessId }
            });
        } else {
            await prisma.productionProcess.create({
                data: { name, requiresMachine, businessId }
            });
        }
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteProductionProcess(id: string) {
    try {
        await prisma.productionProcess.delete({ where: { id } });
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/* --- Workforce --- */
export async function getProductionWorkforce(businessId?: string) {
    return await prisma.productionWorker.findMany({
        where: businessId ? { businessId } : {},
        orderBy: { name: 'asc' }
    });
}

export async function syncProductionWorker(worker: any) {
    try {
        const { id, businessId, ...data } = worker;
        if (id && id.length > 5) {
            await prisma.productionWorker.update({
                where: { id },
                data: { ...data, businessId }
            });
        } else {
            await prisma.productionWorker.create({
                data: { ...data, businessId }
            });
        }
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteProductionWorker(id: string) {
    try {
        await prisma.productionWorker.delete({ where: { id } });
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/* --- Machinery --- */
export async function getProductionMachinery(businessId?: string) {
    return await prisma.productionMachine.findMany({
        where: businessId ? { businessId } : {},
        orderBy: { name: 'asc' }
    });
}

export async function syncProductionMachine(machine: any) {
    try {
        const { id, businessId, ...data } = machine;
        if (id && id.length > 5) {
            await prisma.productionMachine.update({
                where: { id },
                data: { ...data, businessId }
            });
        } else {
            await prisma.productionMachine.create({
                data: { ...data, businessId }
            });
        }
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteProductionMachine(id: string) {
    try {
        await prisma.productionMachine.delete({ where: { id } });
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
