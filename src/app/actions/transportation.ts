'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeData } from '@/lib/utils';

export async function getTransporters(businessId?: string) {
    return (prisma.user as any).findMany({
        where: {
            role: 'TRANSPORTER' as any,
            ...(businessId ? { OR: [{ shop: { businessId } }, { shopId: null }] } : {})
        },
        orderBy: { name: 'asc' }
    });
}

export async function assignTransporter(transferId: string, transporterId: string) {
    try {
        await (prisma.transfer as any).update({
            where: { id: transferId },
            data: {
                transporterId,
                assignedAt: new Date(),
                status: 'ASSIGNED'
            }
        });
        revalidatePath('/admin/transfers');
        revalidatePath('/admin/transportation');
        return { success: true };
    } catch (error) {
        console.error('Error assigning transporter:', error);
        return { error: 'Failed to assign transporter' };
    }
}

export async function updateTransportStatus(transferId: string, status: 'SHIPPED' | 'DELIVERED', notes?: string) {
    try {
        const data: any = { status };
        if (status === 'SHIPPED') data.shippedAt = new Date();
        if (status === 'DELIVERED') data.deliveredAt = new Date();

        await (prisma.transfer as any).update({
            where: { id: transferId },
            data
        });
        
        revalidatePath('/admin/transfers');
        revalidatePath('/admin/transportation');
        revalidatePath('/transporter');
        return { success: true };
    } catch (error) {
        console.error('Error updating transport status:', error);
        return { error: 'Failed to update status' };
    }
}

export async function getTransporterTransfers(transporterId: string) {
    const raw = await (prisma.transfer as any).findMany({
        where: { transporterId },
        include: {
            fromShop: true,
            fromWarehouse: true,
            toShop: true,
            toWarehouse: true,
            items: { include: { product: true } }
        },
        orderBy: { date: 'desc' }
    });
    return sanitizeData(raw);
}
