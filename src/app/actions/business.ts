'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function getSelectedBusinessId() {
    const cookieStore = await cookies();
    return cookieStore.get('selectedBusinessId')?.value || null;
}

export async function setSelectedBusinessId(id: string | null) {
    const cookieStore = await cookies();
    if (id && id !== 'null' && id !== 'undefined') {
        cookieStore.set('selectedBusinessId', id, { path: '/' });
    } else {
        cookieStore.delete('selectedBusinessId');
    }
    revalidatePath('/admin', 'layout');
}

export async function getBusinessFilter() {
    const id = await getSelectedBusinessId();
    if (!id || id === 'null' || id === 'undefined') return undefined;
    return { businessId: id };
}

export async function getBusinesses() {
    return prisma.business.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createBusiness(formData: FormData) {
    const name = formData.get('name') as string;

    if (!name) return { error: 'Name is required' };

    try {
        const business = await prisma.business.create({
            data: { name }
        });
        revalidatePath('/admin/businesses');
        return { success: true, business };
    } catch (error) {
        console.error('Error creating business:', error);
        return { error: 'Failed to create business' };
    }
}

export async function updateBusiness(id: string, formData: FormData) {
    const name = formData.get('name') as string;

    if (!name) return { error: 'Name is required' };

    try {
        await prisma.business.update({
            where: { id },
            data: { name }
        });
        revalidatePath('/admin/businesses');
        return { success: true };
    } catch (error) {
        console.error('Error updating business:', error);
        return { error: 'Failed to update business' };
    }
}

export async function deleteBusiness(id: string) {
    try {
        // Check if there are associated shops
        const shopCount = await prisma.shop.count({
            where: { businessId: id }
        });

        if (shopCount > 0) {
            return { error: 'Cannot delete business with associated shops' };
        }

        await prisma.business.delete({
            where: { id }
        });
        revalidatePath('/admin/businesses');
        return { success: true };
    } catch (error) {
        console.error('Error deleting business:', error);
        return { error: 'Failed to delete business' };
    }
}

export async function unassignShop(id: string) {
    try {
        await prisma.shop.update({
            where: { id },
            data: { businessId: null as any }
        });
        revalidatePath('/admin/businesses');
        return { success: true };
    } catch (error) {
        console.error('Error unassigning shop:', error);
        return { error: 'Failed to unassign shop' };
    }
}

export async function unassignCustomer(id: string) {
    try {
        await prisma.customer.update({
            where: { id },
            data: { businessId: null as any }
        });
        revalidatePath('/admin/businesses');
        return { success: true };
    } catch (error) {
        console.error('Error unassigning customer:', error);
        return { error: 'Failed to unassign customer' };
    }
}
