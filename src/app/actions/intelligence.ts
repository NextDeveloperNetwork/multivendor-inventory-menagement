'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { getBusinessFilter, getSelectedBusinessId } from './business';

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
    const businessId = await getSelectedBusinessId();

    try {
        await prisma.activityLog.create({
            data: {
                // @ts-ignore
                businessId: businessId || null,
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



