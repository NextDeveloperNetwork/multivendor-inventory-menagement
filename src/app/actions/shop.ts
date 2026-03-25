'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const shopSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
    businessId: z.string().min(1, "Business assignment is required"),
});

export async function createShop(formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0') || null;
    const longitude = parseFloat(formData.get('longitude') as string || '0') || null;

    const currencyId = formData.get('currencyId') as string || null;
    const businessId = formData.get('businessId') as string;

    try {
        await prisma.shop.create({
            data: {
                name,
                location,
                latitude,
                longitude,
                currencyId,
                businessId
            }
        });

        revalidatePath('/admin/shops');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create shop' };
    }
}

export async function assignUserToShop(userId: string, shopId: string) {
    if (!userId || !shopId) return { error: 'Missing IDs' };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { shopId }
        });
        revalidatePath('/admin/shops');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to assign user' };
    }
}

export async function removeUserFromShop(userId: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { shopId: null }
        });
        revalidatePath('/admin/shops');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to remove user' };
    }
}

export async function updateShop(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0') || null;
    const longitude = parseFloat(formData.get('longitude') as string || '0') || null;
    const currencyId = formData.get('currencyId') as string || null;
    const businessId = formData.get('businessId') as string;

    try {
        await prisma.shop.update({
            where: { id },
            data: {
                name,
                location,
                latitude,
                longitude,
                currencyId,
                businessId
            }
        });

        revalidatePath('/admin/shops');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update shop' };
    }
}
export async function deleteShop(id: string) {
    try {
        // High-level protocol check for active dependencies
        const salesCount = await prisma.sale.count({ where: { shopId: id } });
        if (salesCount > 0) return { error: `PURGE_REJECTED: ${salesCount} active sales protocol records detected in matrix.` };

        const inventoryCount = await prisma.inventory.count({ where: { shopId: id } });
        if (inventoryCount > 0) return { error: `PURGE_REJECTED: ${inventoryCount} active inventory nodes detected.` };

        const shiftCount = await prisma.shift.count({ where: { shopId: id } });
        // NOTE: If shift cycles exist but are not blocking other protocols, we can purge them during this terminal session
        
        const invoiceCount = await prisma.invoice.count({ where: { shopId: id } });
        if (invoiceCount > 0) return { error: `PURGE_REJECTED: ${invoiceCount} inbound logistics manifests assigned to this unit.` };

        const transferCount = await prisma.transfer.count({ 
            where: { 
                OR: [
                    { fromShopId: id },
                    { toShopId: id }
                ] 
            } 
        });
        if (transferCount > 0) return { error: `PURGE_REJECTED: ${transferCount} inter-node transfer logs detected.` };

        // Purge shift protocol memory for this unit
        await prisma.shift.deleteMany({
            where: { shopId: id }
        });

        // Unassign personnel from this branch unit to prevent matrix fragmentation
        await prisma.user.updateMany({
            where: { shopId: id },
            data: { shopId: null }
        });

        // If no dependencies, purge branch unit
        await prisma.shop.delete({
            where: { id }
        });

        revalidatePath('/admin/shops');
        return { success: true };
    } catch (error) {
        console.error('Error deleting shop:', error);
        return { error: 'CRITICAL_FAILURE: Failed to purge branch from matrix environment.' };
    }
}
