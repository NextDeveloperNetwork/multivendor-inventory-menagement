'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from './intelligence';

export async function updateTransportStatus(id: string, type: 'SHIP' | 'DELIVER' | 'RETURN' | 'PAID') {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized Node Access' };

    try {
        const updateData: any = {};
        let logAction = '';
        let details = '';

        if (type === 'SHIP') {
            updateData.status = 'SHIPPED';
            updateData.shippedAt = new Date();
            logAction = 'TRANSFER_SHIPPED';
            details = `Transfer manifest ${id} marked as SHIPPED by transporter.`;
        } else if (type === 'DELIVER') {
            updateData.status = 'DELIVERED';
            updateData.deliveredAt = new Date();
            logAction = 'TRANSFER_DELIVERED';
            details = `Transfer manifest ${id} marked as DELIVERED by transporter. Final destination sync complete.`;
        } else if (type === 'RETURN') {
            updateData.status = 'RETURNED';
            logAction = 'TRANSFER_RETURNED';
            details = `Goods from manifest ${id} have been REJECTED/RETURNED to origin.`;
        } else if (type === 'PAID') {
            updateData.status = 'PAID';
            updateData.isPaid = true;
            updateData.paidAt = new Date();
            updateData.deliveredAt = new Date();
            logAction = 'TRANSFER_PAID';
            details = `Logistics manifest ${id} has been marked as PAID/SETTLED.`;
        }

        const result = await (prisma as any).transfer.update({
            where: { id },
            data: updateData
        });

        await logActivity({
            action: logAction,
            entityType: 'TRANSFER',
            entityId: id,
            details
        });

        revalidatePath('/transporter');
        revalidatePath('/admin/transfers');
        revalidatePath('/admin/inventory');
        revalidatePath('/shop');
        revalidatePath('/shop/inventory');
        revalidatePath('/admin');
        
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Database Synchronization Error' };
    }
}
