'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const shopSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
});

export async function createShop(formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0') || null;
    const longitude = parseFloat(formData.get('longitude') as string || '0') || null;

    const currencyId = formData.get('currencyId') as string || null;

    try {
        await prisma.shop.create({
            data: {
                name,
                location,
                latitude,
                longitude,
                currencyId
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

    try {
        await prisma.shop.update({
            where: { id },
            data: {
                name,
                location,
                latitude,
                longitude,
                currencyId
            }
        });

        revalidatePath('/admin/shops');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update shop' };
    }
}
