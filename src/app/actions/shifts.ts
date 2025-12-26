'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from './intelligence';

export async function openShift(shopId: string, openingCash: number, userId: string) {
    try {
        const shift = await (prisma as any).shift.create({
            data: {
                shopId,
                userId,
                openingCash,
                status: 'OPEN'
            }
        });

        await logActivity({
            action: 'SHIFT_OPENED',
            entityType: 'SHIFT',
            entityId: shift.id,
            details: `Shift opened at Shop ID: ${shopId} with $${openingCash}`,
            userId,
            shopId
        });

        revalidatePath('/shop/pos');
        return { success: true, shift };
    } catch (e) {
        return { error: 'Failed to open shift' };
    }
}

export async function closeShift(shiftId: string, actualCash: number) {
    try {
        const shift = await (prisma as any).shift.findUnique({ where: { id: shiftId } });
        if (!shift) return { error: 'Shift not found' };

        // Calculate expected cash (this is a simplified version)
        // In a real app, sum up all cash sales during this shift
        const sales = await prisma.sale.findMany({
            where: {
                shopId: shift.shopId,
                date: { gte: shift.openedAt }
            }
        });

        const totalSalesCash = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
        const expectedCash = Number(shift.openingCash) + totalSalesCash;
        const difference = actualCash - expectedCash;

        const updatedShift = await (prisma as any).shift.update({
            where: { id: shiftId },
            data: {
                closedAt: new Date(),
                actualCash,
                closingCash: expectedCash,
                difference,
                status: 'CLOSED'
            }
        });

        await logActivity({
            action: 'SHIFT_CLOSED',
            entityType: 'SHIFT',
            entityId: shiftId,
            details: `Shift closed. Difference: $${difference.toFixed(2)}`,
            shopId: shift.shopId
        });

        revalidatePath('/shop/pos');
        return { success: true, shift: updatedShift };
    } catch (e) {
        return { error: 'Failed to close shift' };
    }
}

export async function getActiveShift(shopId: string, userId: string) {
    return (prisma as any).shift.findFirst({
        where: {
            shopId,
            userId,
            status: 'OPEN'
        }
    });
}
