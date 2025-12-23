'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const warehouseSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export async function createWarehouse(formData: FormData) {
    const name = formData.get('name') as string;

    if (!name) return { error: "Name is required" };

    try {
        await prisma.warehouse.create({
            data: { name }
        });

        revalidatePath('/admin/warehouses');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { error: "Failed to create warehouse" };
    }
}
