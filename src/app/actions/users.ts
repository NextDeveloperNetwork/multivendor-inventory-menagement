'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from './intelligence';
import bcrypt from 'bcryptjs';

export async function getUsers() {
    const users = await prisma.user.findMany({
        where: {
            role: {
                notIn: ['POSTAL_MANAGER', 'POSTAL_CLIENT']
            }
        },
        include: {
            shop: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return users.map(u => {
        const user = u as any;
        return {
            ...u,
            postalBaseFee: user.postalBaseFee ? Number(user.postalBaseFee) : 0,
            postalManagerCut: user.postalManagerCut ? Number(user.postalManagerCut) : 0
        };
    });
}

export async function updateUser(id: string, formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as any;
    const shopId = formData.get('shopId') as string;
    const transporterId = formData.get('transporterId') as string;
    const password = formData.get('password') as string;
    const allowedPathsRaw = formData.get('allowedPaths') as string;
    const allowedPaths = allowedPathsRaw ? allowedPathsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const updateData: any = {
        name,
        email,
        role,
        shopId: shopId || null,
        transporterId: transporterId || null,
        allowedPaths
    };

    if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
    }

    try {
        const user = await prisma.user.update({
            where: { id },
            data: updateData
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
    if ((session?.user as any)?.role !== 'ADMIN') return { error: 'Unauthorized' };

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

export async function forceLogoutUser(id: string) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return { error: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id },
            data: { sessionVersion: { increment: 1 } }
        });

        await logActivity({
            action: 'USER_FORCED_LOGOUT',
            entityType: 'USER',
            entityId: id,
            details: `Admin forced session termination for user`
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to force log out' };
    }
}
