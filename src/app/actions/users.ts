'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from './intelligence';

export async function getUsers() {
    return prisma.user.findMany({
        include: {
            shop: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateUser(id: string, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as any;
    const shopId = formData.get('shopId') as string;

    try {
        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                shopId: shopId || null
            }
        });

        await logActivity({
            action: 'USER_UPDATED',
            entityType: 'USER',
            entityId: user.id,
            details: `Updated user profile for: ${user.email}. Role: ${role}`
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update user' };
    }
}

export async function deleteUser(id: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };

    try {
        const user = await prisma.user.delete({
            where: { id }
        });

        await logActivity({
            action: 'USER_DELETED',
            entityType: 'USER',
            entityId: id,
            details: `Deleted user profile: ${user.email}`
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to delete user' };
    }
}
