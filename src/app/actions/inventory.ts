'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateBarcode, sanitizeData } from '@/lib/utils';
import Papa from 'papaparse';

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional().nullable(),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    cost: z.coerce.number().min(0, "Cost must be positive"),
    discountPrice: z.coerce.number().optional().nullable(),
    initialStock: z.coerce.number().optional(), // Added for convenience
    targetType: z.enum(['warehouse', 'shop']).optional(),
    targetId: z.string().optional(),
    businessId: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
});

export async function createProduct(formData: FormData) {
    const data = Object.fromEntries(formData.entries());

    // Handle empty string for discountPrice as null
    if (data.discountPrice === '') {
        data.discountPrice = null as any;
    }

    const result = productSchema.safeParse(data);

    if (!result.success) {
        return { error: 'Invalid input data', details: result.error.flatten() };
    }

    try {
        const { name, sku, barcode, description, price, cost, discountPrice, initialStock, imageUrl } = result.data;
        const finalBarcode = barcode || generateBarcode();

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

        const product = await prisma.$transaction(async (tx: any) => {
            const p = await tx.product.create({
                data: {
                    name,
                    sku,
                    barcode: finalBarcode,
                    description,
                    price,
                    cost,
                    discountPrice,
                    imageUrl,
                    businessId: result.data.businessId,
                }
            });

            // Use specified location if provided, otherwise fallback to Main Warehouse
            if (initialStock && initialStock > 0) {
                let actualTargetId = result.data.targetId;
                let actualTargetType = result.data.targetType || 'warehouse';

                // Fallback to warehouse if no ID is provided, even if 'shop' was selected but left empty
                if (!actualTargetId) {
                    actualTargetType = 'warehouse';
                    let warehouse = await tx.warehouse.findFirst({
                        where: { businessId: result.data.businessId } as any
                    });
                    if (!warehouse) {
                        warehouse = await tx.warehouse.create({
                            data: {
                                name: 'Main Warehouse',
                                businessId: result.data.businessId
                            } as any,
                        });
                    }
                    actualTargetId = warehouse.id;
                }

                if (actualTargetId) {
                    await tx.inventory.create({
                        data: {
                            productId: p.id,
                            warehouseId: actualTargetType === 'warehouse' ? actualTargetId : null,
                            shopId: actualTargetType === 'shop' ? actualTargetId : null,
                            quantity: initialStock
                        }
                    });
                }
            }
            return p;
        });

        revalidatePath('/admin/inventory');
        return { success: true, product: sanitizeData(product) };
    } catch (error) {
        console.error('Create product error:', error);
        return { error: 'Failed to create product' };
    }
}

export async function updateProduct(id: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries());

    // Handle empty string for discountPrice as null
    if (data.discountPrice === '') {
        data.discountPrice = null as any;
    }

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
        await prisma.$transaction(async (tx) => {
            // Delete related records that prevent product deletion
            await tx.inventory.deleteMany({ where: { productId: id } });
            await tx.invoiceItem.deleteMany({ where: { productId: id } });
            await tx.saleItem.deleteMany({ where: { productId: id } });
            await tx.transferItem.deleteMany({ where: { productId: id } });

            await tx.product.delete({
                where: { id },
            });
        });

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/invoices');
        revalidatePath('/shop');
        return { success: true };
    } catch (error) {
        console.error('Delete product error:', error);
        return { error: 'Failed to delete product' };
    }
}

export async function bulkDeleteProducts(productIds: string[]) {
    try {
        if (!productIds || productIds.length === 0) {
            return { error: 'No products selected' };
        }

        const count = await prisma.$transaction(async (tx) => {
            await tx.inventory.deleteMany({ where: { productId: { in: productIds } } });
            await tx.invoiceItem.deleteMany({ where: { productId: { in: productIds } } });
            await tx.saleItem.deleteMany({ where: { productId: { in: productIds } } });
            await tx.transferItem.deleteMany({ where: { productId: { in: productIds } } });

            const result = await tx.product.deleteMany({
                where: {
                    id: { in: productIds }
                }
            });
            return result.count;
        });

        revalidatePath('/admin/inventory');
        revalidatePath('/shop/inventory');
        return { success: true, count };
    } catch (error) {
        console.error('Bulk delete error:', error);
        return { error: 'Failed to delete products' };
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

export async function quickAddStock(productId: string, quantity: number, targetId: string) {
    try {
        // Try to determine if it's a shop or warehouse
        const isShop = await prisma.shop.findUnique({ where: { id: targetId } });

        if (isShop) {
            await prisma.inventory.upsert({
                where: {
                    productId_shopId: { productId, shopId: targetId }
                },
                update: {
                    quantity: { increment: quantity }
                },
                create: {
                    productId,
                    shopId: targetId,
                    quantity
                }
            });
        } else {
            await prisma.inventory.upsert({
                where: {
                    productId_warehouseId: { productId, warehouseId: targetId }
                },
                update: {
                    quantity: { increment: quantity }
                },
                create: {
                    productId,
                    warehouseId: targetId,
                    quantity
                }
            });
        }

        revalidatePath('/admin/inventory');
        revalidatePath('/shop');
        return { success: true };
    } catch (e) {
        console.error('quickAddStock error:', e);
        return { error: 'Failed to update stock' };
    }
}

export async function setStockLevel(productId: string, quantity: number, targetId: string) {
    try {
        const isShop = await prisma.shop.findUnique({ where: { id: targetId } });

        if (isShop) {
            await prisma.inventory.upsert({
                where: {
                    productId_shopId: { productId, shopId: targetId }
                },
                update: {
                    quantity: quantity
                },
                create: {
                    productId,
                    shopId: targetId,
                    quantity
                }
            });
        } else {
            await prisma.inventory.upsert({
                where: {
                    productId_warehouseId: { productId, warehouseId: targetId }
                },
                update: {
                    quantity: quantity
                },
                create: {
                    productId,
                    warehouseId: targetId,
                    quantity
                }
            });
        }

        revalidatePath('/admin/inventory');
        revalidatePath('/shop');
        return { success: true };
    } catch (e) {
        console.error('setStockLevel error:', e);
        return { error: 'Failed to update stock' };
    }
}

export async function bulkCreateProducts(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded' };
        }

        const csvText = await file.text();
        const { data, errors } = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase(), // Normalize headers
        });

        if (errors.length > 0) {
            console.error('CSV Parse errors:', errors);
            return { success: false, error: 'Failed to parse CSV file', details: errors };
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Process each row
        /* eslint-disable @typescript-eslint/no-explicit-any */
        for (const [index, row] of (data as any[]).entries()) {
            try {
                // Map CSV headers to schema fields
                // Expected headers: name, sku, barcode, description, price, cost, initial_stock/stock/quantity
                const productData = {
                    name: row.name,
                    sku: row.sku,
                    barcode: row.barcode || null,
                    description: row.description,
                    price: parseFloat(row.price || '0'),
                    cost: parseFloat(row.cost || '0'),
                    initialStock: parseInt(row.initial_stock || row.stock || row.quantity || '0', 10),
                };

                // Validate with existing schema
                const validation = productSchema.safeParse(productData);
                if (!validation.success) {
                    results.failed++;
                    results.errors.push(`Row ${index + 1} (${row.name || 'Unknown'}): Invalid data - ${validation.error.issues.map(i => i.message).join(', ')}`);
                    continue;
                }

                const { name, sku, barcode, description, price, cost, initialStock } = validation.data;
                const finalBarcode = barcode || generateBarcode();
                const businessId = formData.get('businessId') as string;

                // Check for existing
                const existing = await prisma.product.findFirst({
                    where: {
                        businessId,
                        OR: [
                            { sku },
                            { barcode: finalBarcode }
                        ]
                    } as any
                });

                if (existing) {
                    results.failed++;
                    results.errors.push(`Row ${index + 1} (${name}): SKU or Barcode already exists`);
                    continue;
                }

                await prisma.$transaction(async (tx: any) => {
                    const p = await tx.product.create({
                        data: {
                            name,
                            sku,
                            barcode: finalBarcode,
                            description,
                            price,
                            cost,
                            businessId
                        }
                    });

                    if (initialStock && initialStock > 0) {
                        let warehouse = await tx.warehouse.findFirst({
                            where: { businessId }
                        });
                        if (!warehouse) {
                            warehouse = await tx.warehouse.create({
                                data: {
                                    name: 'Main Warehouse',
                                    businessId
                                },
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
                });

                results.success++;

            } catch (err) {
                console.error(`Error processing row ${index}:`, err);
                results.failed++;
                results.errors.push(`Row ${index + 1}: Unexpected error`);
            }
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */

        revalidatePath('/admin/inventory');
        return { success: true, results };
    } catch (error) {
        console.error('Bulk create error:', error);
        return { success: false, error: 'Failed to process bulk upload' };
    }
}

export async function manualBulkCreateProducts(rows: any[], options: { businessId: string | null, targetType: 'warehouse' | 'shop', targetId?: string }) {
    try {
        const { businessId, targetType, targetId } = options;
        let count = 0;

        await prisma.$transaction(async (tx: any) => {
            for (const row of rows) {
                const finalBarcode = generateBarcode();
                const p = await tx.product.create({
                    data: {
                        name: row.name,
                        sku: row.sku,
                        barcode: finalBarcode,
                        price: parseFloat(row.price),
                        cost: parseFloat(row.cost),
                        businessId
                    }
                });

                const qty = parseInt(row.initialStock || '0');
                if (qty > 0 && targetId) {
                    await tx.inventory.create({
                        data: {
                            productId: p.id,
                            warehouseId: targetType === 'warehouse' ? targetId : null,
                            shopId: targetType === 'shop' ? targetId : null,
                            quantity: qty
                        }
                    });
                }
                count++;
            }
        });

        revalidatePath('/admin/inventory');
        return { success: true, count };
    } catch (error) {
        console.error('Manual bulk create error:', error);
        return { success: false, error: 'Failed to create products in bulk' };
    }
}
