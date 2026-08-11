'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSelectedBusinessId } from './business';
import { sanitizeData } from '@/lib/utils';

/**
 * FETCH OR CREATE ARTICLE DEFINITION (WITH COLORS & SIZES)
 */
export async function getCountArticles() {
    const businessId = await getSelectedBusinessId();
    if (!(prisma as any).countArticle) {
        console.error('Prisma countArticle model not ready yet.');
        return [];
    }
    const articles = await (prisma as any).countArticle.findMany({
        where: businessId ? { businessId } : {},
        orderBy: { name: 'asc' }
    });
    return sanitizeData(articles);
}

export async function createCountArticle(data: {
    name: string;
    code?: string;
    colors: string[];
    sizes: string[];
}) {
    const businessId = await getSelectedBusinessId();

    try {
        if (!(prisma as any).countArticle) {
            return { error: 'Prisma client updating. Please refresh the page.' };
        }
        const article = await (prisma as any).countArticle.create({
            data: {
                name: data.name,
                code: data.code || null,
                colors: data.colors.filter(Boolean),
                sizes: data.sizes.filter(Boolean),
                businessId
            }
        });

        revalidatePath('/sales/requests');
        revalidatePath('/admin/sales/requests');
        return { success: true, article: sanitizeData(article) };
    } catch (e: any) {
        console.error('Create Count Article Error:', e);
        return { error: e.message || 'Failed to create article' };
    }
}

export async function deleteCountArticle(id: string) {
    try {
        if (!(prisma as any).countArticle) return { error: 'Prisma client updating.' };
        await (prisma as any).countArticle.delete({ where: { id } });
        revalidatePath('/sales/requests');
        revalidatePath('/admin/sales/requests');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Failed to delete article' };
    }
}

/**
 * COUNTING SESSION MANAGERS
 */
export async function getActiveCountSession() {
    const businessId = await getSelectedBusinessId();
    if (!(prisma as any).countSession) {
        console.error('Prisma countSession model not ready yet.');
        return { id: 'temp', name: 'Counting Session', status: 'OPEN', createdAt: new Date().toISOString(), items: [] };
    }
    let session = await (prisma as any).countSession.findFirst({
        where: {
            status: 'OPEN',
            ...(businessId ? { businessId } : {})
        },
        include: {
            items: {
                include: { article: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!session) {
        session = await (prisma as any).countSession.create({
            data: {
                name: `Inventory Count - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                status: 'OPEN',
                businessId
            },
            include: {
                items: {
                    include: { article: true }
                }
            }
        });
    }

    return sanitizeData(session);
}

export async function createNewCountSession(name: string, notes?: string) {
    const businessId = await getSelectedBusinessId();
    try {
        // Mark previous open sessions as COMPLETED if creating a new one
        await (prisma as any).countSession.updateMany({
            where: { status: 'OPEN', ...(businessId ? { businessId } : {}) },
            data: { status: 'COMPLETED' }
        });

        const session = await (prisma as any).countSession.create({
            data: {
                name: name || `Counting Session ${new Date().toLocaleDateString()}`,
                notes: notes || null,
                status: 'OPEN',
                businessId
            }
        });

        revalidatePath('/sales/requests');
        revalidatePath('/admin/sales/requests');
        return { success: true, session: sanitizeData(session) };
    } catch (e: any) {
        return { error: e.message || 'Failed to create new counting session' };
    }
}

/**
 * SAVE COLOR × SIZE MATRIX COUNTS FOR AN ARTICLE
 */
export async function saveArticleMatrixCounts(data: {
    sessionId: string;
    articleId: string;
    counts: { color: string; size: string; quantity: number }[];
}) {
    const { sessionId, articleId, counts } = data;

    try {
        await (prisma as any).$transaction(async (tx: any) => {
            for (const item of counts) {
                if (item.quantity > 0) {
                    await tx.countSessionItem.upsert({
                        where: {
                            sessionId_articleId_color_size: {
                                sessionId,
                                articleId,
                                color: item.color,
                                size: item.size
                            }
                        },
                        update: {
                            quantity: item.quantity
                        },
                        create: {
                            sessionId,
                            articleId,
                            color: item.color,
                            size: item.size,
                            quantity: item.quantity
                        }
                    });
                } else {
                    // Delete zero-quantity records to keep dataset lean
                    await tx.countSessionItem.deleteMany({
                        where: {
                            sessionId,
                            articleId,
                            color: item.color,
                            size: item.size
                        }
                    });
                }
            }
        });

        revalidatePath('/sales/requests');
        revalidatePath('/admin/sales/requests');
        return { success: true };
    } catch (e: any) {
        console.error('Save Matrix Counts Error:', e);
        return { error: e.message || 'Failed to save matrix counts' };
    }
}

/**
 * COMPLETE / LOCK COUNTING SESSION
 */
export async function completeCountSession(sessionId: string) {
    try {
        await (prisma as any).countSession.update({
            where: { id: sessionId },
            data: { status: 'COMPLETED' }
        });

        revalidatePath('/sales/requests');
        revalidatePath('/admin/sales/requests');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Failed to complete session' };
    }
}
