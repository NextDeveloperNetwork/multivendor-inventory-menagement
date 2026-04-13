'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from './intelligence';

export async function getProductionArticles(businessId?: string, source?: 'ADMIN' | 'MANAGER') {
    try {
        const whereClause: any = businessId ? { businessId } : {};
        if (source === 'ADMIN') whereClause.isManager = false;
        if (source === 'MANAGER') whereClause.isManager = true;

        const articles = await prisma.productionArticle.findMany({
            where: whereClause,
            include: {
                processes: { orderBy: { sequence: 'asc' } },
                bom: true
            },
            orderBy: { name: 'asc' }
        });

        // Fetch yields for all articles and processes
        const yields = await prisma.productionLog.groupBy({
            by: ['articleName', 'procName'],
            where: {
                ...(businessId ? { businessId } : {}),
                isManager: source === 'MANAGER'
            },
            _sum: {
                quantity: true
            }
        });

        // Create a fast lookup map: articleName -> { procName -> totalYield }
        const yieldMap = new Map<string, Map<string, number>>();
        yields.forEach((y: any) => {
            if (!yieldMap.has(y.articleName)) yieldMap.set(y.articleName, new Map());
            yieldMap.get(y.articleName)!.set(y.procName, y._sum.quantity || 0);
        });
        return articles.map(a => {
            let finalYield = 0;
            let startedYield = 0;
            
            if (a.isManager) {
                const articleYields = yieldMap.get(a.name);
                if (articleYields) {
                    let total = 0;
                    articleYields.forEach(qty => total += qty);
                    finalYield = total;
                    startedYield = total;
                }
            } else if (a.processes.length > 0) {
                const firstProcess = a.processes[0];
                const lastProcess = a.processes[a.processes.length - 1]; // Already ordered by sequence ascending
                const articleYields = yieldMap.get(a.name);
                
                if (articleYields) {
                    if (lastProcess) {
                        finalYield = articleYields.get(lastProcess.processName) || 0;
                    }
                    if (firstProcess) {
                        startedYield = articleYields.get(firstProcess.processName) || 0;
                    }
                }
            } else {
                // Fallback if the article has no processes defined but logs exist
                const articleYields = yieldMap.get(a.name);
                if (articleYields) {
                    let maxOutput = 0;
                    articleYields.forEach(val => { if (val > maxOutput) maxOutput = val; });
                    finalYield = maxOutput;
                    startedYield = maxOutput;
                }
            }

            return {
                ...a,
                totalYield: finalYield,
                startedYield: startedYield
            };
        });
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        return [];
    }
}



export async function syncProductionArticle(article: any) {
    try {
        const { id, processes = [], bom = [], businessId, totalYield, createdAt, updatedAt, ...data } = article;
        
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
                    name: data.name,
                    sku: data.sku,
                    description: data.description,
                    type: data.type,
                    stockQuantity: Number(data.stockQuantity) || 0,
                    batchSize: Number(data.batchSize) || 1,
                    unit: data.unit,
                    entryDate: data.entryDate,
                    invoiceNo: data.invoiceNo,
                    supplierName: data.supplierName,
                    isManager: data.isManager || false,
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
                    name: data.name,
                    sku: data.sku,
                    description: data.description,
                    type: data.type,
                    stockQuantity: Number(data.stockQuantity) || 0,
                    batchSize: Number(data.batchSize) || 1,
                    unit: data.unit,
                    entryDate: data.entryDate,
                    invoiceNo: data.invoiceNo,
                    supplierName: data.supplierName,
                    isManager: data.isManager || false,
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

        const action = (id && id.length > 10 && !id.startsWith('art_')) ? 'ARTICLE_UPDATED' : 'ARTICLE_CREATED';
        await logActivity({
            action,
            entityType: 'PRODUCTION_ARTICLE',
            entityId: savedArticle.id,
            details: `${action.replace('_', ' ')}: ${data.name} (${data.sku || 'No SKU'})`
        });

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
        await logActivity({
            action: 'ARTICLE_DELETED',
            entityType: 'PRODUCTION_ARTICLE',
            entityId: id,
            details: `Article record removed from inventory catalog.`
        });
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
        const { id, name, requiresMachine, deployAllWorkforce, businessId } = process;
        
        // Basic validation
        if (!name || name.trim() === '') return { error: 'Process name is required' };

        if (id && id.length > 5) {
            // Update existing
            await prisma.productionProcess.update({
                where: { id },
                data: { name: name.trim(), requiresMachine, deployAllWorkforce, businessId }
            });
        } else {
            // Check for duplicate name if no ID (to provide better error than raw Prisma)
            const existing = await prisma.productionProcess.findUnique({
                where: { name: name.trim() }
            });
            
            if (existing) {
                return { error: `A process named "${name.trim()}" already exists in the global registry.` };
            }

            await prisma.productionProcess.create({
                data: { name: name.trim(), requiresMachine, deployAllWorkforce, businessId }
            });
        }
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Process name conflict: This name is already taken.' };
        }
        console.error('SYNC PROCESS FAILED:', error);
        return { error: error.message || 'Failed to synchronize process' };
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
        const action = (id && id.length > 5) ? 'WORKER_UPDATED' : 'WORKER_REGISTERED';
        const saved = (id && id.length > 5) 
            ? await prisma.productionWorker.update({ where: { id }, data: { ...data, businessId } })
            : await prisma.productionWorker.create({ data: { ...data, businessId } });

        await logActivity({
            action,
            entityType: 'PRODUCTION_WORKER',
            entityId: saved.id,
            details: `${action.replace('_', ' ')}: ${data.name} [${data.skills.join(', ')}]`
        });
        
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

export async function deleteAllProductionWorkers(businessId?: string) {
    try {
        await prisma.productionWorker.deleteMany({
            where: businessId ? { businessId } : {}
        });
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
        const action = (id && id.length > 5) ? 'MACHINE_UPDATED' : 'MACHINE_MOUNTED';
        const saved = (id && id.length > 5)
            ? await prisma.productionMachine.update({ where: { id }, data: { ...data, businessId } })
            : await prisma.productionMachine.create({ data: { ...data, businessId } });

        await logActivity({
            action,
            entityType: 'PRODUCTION_MACHINE',
            entityId: saved.id,
            details: `${action.replace('_', ' ')}: ${data.name}`
        });

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
