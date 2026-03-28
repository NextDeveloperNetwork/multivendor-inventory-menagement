'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from './intelligence';

export async function getTransporters(businessId?: string) {
    return (prisma as any).transporter.findMany({
        where: businessId ? { businessId } : {},
        include: { _count: { select: { users: true } } },
        orderBy: { name: 'asc' }
    });
}

export async function createTransporter(data: any) {
    try {
        const transporter = await (prisma as any).transporter.create({
            data: {
                ...data,
                businessId: data.businessId || null
            }
        });

        await logActivity({
            action: 'TRANSPORTER_CREATED',
            entityType: 'TRANSPORTER',
            entityId: transporter.id,
            details: `Registered new transporter unit: ${transporter.name}`
        });

        revalidatePath('/admin/transporters');
        return { success: true, transporter };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create transporter' };
    }
}

export async function updateTransporter(id: string, data: any) {
    try {
        await (prisma as any).transporter.update({
            where: { id },
            data
        });

        revalidatePath('/admin/transporters');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update transporter' };
    }
}

export async function deleteTransporter(id: string) {
    try {
        await (prisma as any).transporter.delete({
            where: { id }
        });

        revalidatePath('/admin/transporters');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to delete transporter unit' };
    }
}
