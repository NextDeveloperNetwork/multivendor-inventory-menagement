'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const warehouseSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export async function createWarehouse(formData: FormData) {
    const name = formData.get('name') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0') || null;
    const longitude = parseFloat(formData.get('longitude') as string || '0') || null;

    if (!name) return { error: "Name is required" };

    try {
        await prisma.warehouse.create({
            data: {
                name,
                latitude,
                longitude
            }
        });

        revalidatePath('/admin/warehouses');
        revalidatePath('/admin/inventory');
        revalidatePath('/admin/map');
        return { success: true };
    } catch (error) {
        return { error: "Failed to create warehouse" };
    }
}

export async function deleteWarehouse(id: string) {
    try {
        await prisma.warehouse.delete({
            where: { id }
        });
        revalidatePath('/admin/warehouses');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete warehouse. Ensure it has no inventory.' };
    }
}
