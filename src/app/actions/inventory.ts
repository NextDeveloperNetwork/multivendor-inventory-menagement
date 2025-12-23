'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateEAN13 } from '@/lib/utils';

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional().nullable(),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    cost: z.coerce.number().min(0, "Cost must be positive"),
    initialStock: z.coerce.number().optional(), // Added for convenience
});

export async function createProduct(formData: FormData) {
    const data = Object.fromEntries(formData.entries());

    const result = productSchema.safeParse(data);

    if (!result.success) {
        return { error: 'Invalid input data', details: result.error.flatten() };
    }

    try {
        const { name, sku, barcode, description, price, cost, initialStock } = result.data;
        const finalBarcode = barcode || generateEAN13();

        const existing = await prisma.product.findFirst({
            where: {
                OR: [
                    { sku },
                    { barcode: finalBarcode }
                ]
            }
        });

        if (existing) {
            if (existing.sku === sku) return { error: 'Product with this SKU already exists' };
            if (existing.barcode === finalBarcode) {
                // If the auto-generated barcode exists, try one more time or just error
                return { error: 'Generated barcode conflict. Please try again.' };
            }
        }

        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    name,
                    sku,
                    barcode: finalBarcode,
                    description,
                    price,
                    cost,
                }
            });

            // Put initial stock into Main Warehouse instead of shops
            if (initialStock && initialStock > 0) {
                let warehouse = await tx.warehouse.findFirst();
                if (!warehouse) {
                    warehouse = await tx.warehouse.create({
                        data: { name: 'Main Warehouse' },
                    });
                }

                await tx.inventory.create({
                    data: {
                        productId: p.id,
                        warehouseId: warehouse.id,
                        quantity: initialStock
                    }
                });
            }
            return p;
        });

        revalidatePath('/admin/inventory');
        return { success: true, product };
    } catch (error) {
        console.error('Create product error:', error);
        return { error: 'Failed to create product' };
    }
}

export async function updateProduct(id: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const result = productSchema.partial().safeParse(data);

    if (!result.success) {
        return { error: 'Invalid input data', details: result.error.flatten() };
    }

    try {
        await prisma.product.update({
            where: { id },
            data: result.data,
        });

        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error('Update product error:', error);
        return { error: 'Failed to update product' };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        });

        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error('Delete product error:', error);
        return { error: 'Failed to delete product' };
    }
}

export async function getProductInvoiceHistory(productId: string) {
    try {
        const history = await prisma.invoiceItem.findMany({
            where: { productId },
            include: {
                invoice: {
                    include: {
                        supplier: true
                    }
                },
                product: true
            },
            orderBy: {
                invoice: {
                    date: 'desc'
                }
            }
        });
        return history;
    } catch (error) {
        console.error('Error fetching product history:', error);
        return [];
    }
}

export async function quickAddStock(productId: string, quantity: number, shopId: string) {
    try {
        await prisma.inventory.upsert({
            where: {
                productId_shopId: { productId, shopId }
            },
            update: {
                quantity: { increment: quantity }
            },
            create: {
                productId,
                shopId,
                quantity
            }
        });
        revalidatePath('/admin/inventory');
        revalidatePath('/shop');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update stock' };
    }
}
