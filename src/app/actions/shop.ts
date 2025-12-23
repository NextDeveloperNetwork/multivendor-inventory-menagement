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
    const location = formData.get('location') as string; // location is optional in schema? check schema

    try {
        await prisma.shop.create({
            data: {
                name,
                location,
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
