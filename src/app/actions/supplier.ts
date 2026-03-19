'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeData } from '@/lib/utils';

import { getBusinessFilter } from './business';

export async function createSupplier(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0') || null;
    const longitude = parseFloat(formData.get('longitude') as string || '0') || null;
    const businessId = formData.get('businessId') as string;

    try {
        const supplier = await prisma.supplier.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                address: address || null,
                latitude,
                longitude,
                businessId
            } as any,
        });

        revalidatePath('/admin/suppliers');
        return { success: true, supplier: sanitizeData(supplier) };
    } catch (error) {
        console.error('Error creating supplier:', error);
        return { success: false, error: 'Failed to create supplier' };
    }
}

export async function updateSupplier(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0') || null;
    const longitude = parseFloat(formData.get('longitude') as string || '0') || null;

    try {
        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                address: address || null,
                latitude,
                longitude,
            },
        });

        revalidatePath('/admin/suppliers');
        return { success: true, supplier: sanitizeData(supplier) };
    } catch (error) {
        console.error('Error updating supplier:', error);
        return { success: false, error: 'Failed to update supplier' };
    }
}

export async function deleteSupplier(id: string) {
    try {
        await prisma.supplier.delete({
            where: { id },
        });

        revalidatePath('/admin/suppliers');
        return { success: true };
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return { success: false, error: 'Failed to delete supplier' };
    }
}

export async function getSuppliers(filter: any = {}) {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: filter as any,
            include: {
                invoices: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return suppliers;
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
    }
}
