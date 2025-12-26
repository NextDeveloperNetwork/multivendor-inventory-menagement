'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * TELEMETRY & AUDIT LOGGING
 * Records every significant action in the system for transparency and security.
 */
export async function logActivity(data: {
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
    userId?: string;
    shopId?: string;
}) {
    // Note: in a real app, we'd get the businessId and userId from the session
    const business = await (prisma as any).business.findFirst();
    if (!business) return;

    try {
        await (prisma as any).activityLog.create({
            data: {
                businessId: business.id,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                details: data.details,
                userId: data.userId
            }
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

/**
 * PREDICTIVE STOCK ANALYSIS
 * Calculates days of cover based on rolling 30-day sales velocity.
 */
export async function getStockPredictions(shopId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all sales for this shop in the last 30 days
    const sales = await (prisma as any).sale.findMany({
        where: {
            shopId,
            date: { gte: thirtyDaysAgo }
        },
        include: { items: true }
    });

    const inventory = await prisma.inventory.findMany({
        where: { shopId },
        include: { product: true }
    });

    const predictions = inventory.map(item => {
        // Calculate velocity (units per day)
        const unitsSold = sales.reduce((sum: number, sale: any) => {
            const saleItem = sale.items.find((i: any) => i.productId === item.productId);
            return sum + (saleItem?.quantity || 0);
        }, 0);

        const velocity = unitsSold / 30; // Average units per day
        const daysLeft = velocity > 0 ? Math.floor(item.quantity / velocity) : Infinity;

        return {
            productId: item.productId,
            name: item.product.name,
            currentStock: item.quantity,
            velocity: velocity.toFixed(2),
            daysLeft,
            status: daysLeft < 7 ? 'CRITICAL' : daysLeft < 14 ? 'WARNING' : 'STABLE'
        };
    });

    return predictions.filter(p => p.velocity !== "0.00").sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * FINANCIAL INTELLIGENCE
 * Calculates net profit by comparing sale price vs cost price.
 */
export async function getProfitAnalytics() {
    const sales = await (prisma as any).sale.findMany({
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
            const qty = item.quantity;
            const price = Number(item.price);
            const cost = Number(item.product.cost);

            totalRevenue += price * qty;
            totalCost += cost * qty;
        });
    });

    const netProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
        revenue: totalRevenue,
        costs: totalCost,
        profit: netProfit,
        margin: margin.toFixed(2)
    };
}

/**
 * CRM & LOYALTY
 */
export async function getCustomers() {
    const business = await (prisma as any).business.findFirst();
    if (!business) return [];

    return (prisma as any).customer.findMany({
        where: { businessId: business.id },
        include: { sales: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createCustomer(formData: FormData) {
    const business = await (prisma as any).business.findFirst();
    if (!business) return { error: 'No business context' };

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    try {
        const customer = await (prisma as any).customer.create({
            data: {
                businessId: business.id,
                name,
                phone,
                email
            }
        });

        await logActivity({
            action: 'CUSTOMER_CREATED',
            entityType: 'CUSTOMER',
            entityId: customer.id,
            details: `New customer: ${name}`
        });

        revalidatePath('/admin/customers');
        return { success: true, customer };
    } catch (e) {
        return { error: 'Failed to create customer' };
    }
}
