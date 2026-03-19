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
    price: z.coerce.number().min(0, "Price must be positive").optional().nullable(),
    cost: z.coerce.number().min(0, "Cost must be positive").optional().nullable(),
    isPriceManual: z.coerce.boolean().optional().default(false),
    discountPrice: z.coerce.number().optional().nullable(),
    initialStock: z.coerce.number().optional(), // Added for convenience
    targetType: z.enum(['warehouse', 'shop']).optional(),
    targetId: z.string().optional(),
    businessId: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    unitId: z.string().optional().nullable(),
    unitName: z.string().optional().nullable(), // For auto-creation
    categoryId: z.string().optional().nullable(),
    categoryName: z.string().optional().nullable(), // For auto-creation
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
                return { error: 'Generated barcode conflict. Please try again.' };
            }
        }

        const product = await prisma.$transaction(async (tx: any) => {
            let actualCategoryId = result.data.categoryId;
            let actualUnitId = result.data.unitId;

            // Auto-create category
            if (!actualCategoryId && result.data.categoryName) {
                const existingCat = await (tx as any).productCategory.findFirst({
                    where: { name: result.data.categoryName, businessId: result.data.businessId }
                });
                if (existingCat) actualCategoryId = existingCat.id;
                else {
                    const newCat = await (tx as any).productCategory.create({
                        data: { name: result.data.categoryName, businessId: result.data.businessId }
                    });
                    actualCategoryId = newCat.id;
                }
            }

            // Auto-create unit
            if (!actualUnitId && result.data.unitName) {
                const existingUnit = await (tx as any).productUnit.findFirst({
                    where: { name: result.data.unitName, businessId: result.data.businessId }
                });
                if (existingUnit) actualUnitId = existingUnit.id;
                else {
                    const newUnit = await (tx as any).productUnit.create({
                        data: { name: result.data.unitName, businessId: result.data.businessId }
                    });
                    actualUnitId = newUnit.id;
                }
            }

            const priceVal = (price !== null && price !== undefined) ? price : (cost ? cost * 1.4 : 0);
            const costVal = cost || 0;
            const manualVal = (price !== null && price !== undefined);

            const p = await tx.product.create({
                data: {
                    name,
                    sku,
                    barcode: finalBarcode,
                    description,
                    price: priceVal,
                    cost: costVal,
                    discountPrice,
                    imageUrl,
                    unitId: actualUnitId,
                    categoryId: actualCategoryId,
                    businessId: result.data.businessId,
                }
            });

            // Raw SQL fallback for the new field
            try {
                await (tx as any).$executeRawUnsafe(
                    `UPDATE "Product" SET "isPriceManual" = $1 WHERE "id" = $2`,
                    manualVal, p.id
                );
            } catch (rawErr) {
                console.error('Raw Fallback in Create Failed:', rawErr);
            }

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
        console.log('Validation Error:', result.error.flatten());
        return { success: false, error: 'Invalid input data', details: result.error.flatten() };
    }

    try {
        const { categoryName, unitName, initialStock, targetType, targetId, ...otherData } = result.data as any;
        let actualData = { ...otherData } as any;

        if (categoryName) {
            try {
                const existingCat = await (prisma as any).productCategory.findFirst({ where: { name: categoryName } });
                if (existingCat) actualData.categoryId = existingCat.id;
                else {
                    const newCat = await (prisma as any).productCategory.create({ data: { name: categoryName } });
                    actualData.categoryId = newCat.id;
                }
            } catch (e: any) {
                return { success: false, error: `CAT_ERR: ${e.message}` };
            }
        }

        if (unitName) {
            try {
                const existingUnit = await (prisma as any).productUnit.findFirst({ where: { name: unitName } });
                if (existingUnit) actualData.unitId = existingUnit.id;
                else {
                    const newUnit = await (prisma as any).productUnit.create({ data: { name: unitName } });
                    actualData.unitId = newUnit.id;
                }
            } catch (e: any) {
                return { success: false, error: `UNIT_ERR: ${e.message}` };
            }
        }

        if (otherData.price !== undefined && otherData.price !== null) {
            actualData.isPriceManual = true;
        }

        try {
            const manualVal = actualData.isPriceManual;
            if (actualData.hasOwnProperty('isPriceManual')) {
                delete actualData.isPriceManual;
            }

            await (prisma.product as any).update({
                where: { id },
                data: actualData,
            });

            // If we have a manual override value, we'll try a raw SQL update as a fallback 
            // since the Prisma client might be out of date and won't recognize the new field.
            if (manualVal !== undefined) {
                try {
                    await (prisma as any).$executeRawUnsafe(
                        `UPDATE "Product" SET "isPriceManual" = $1 WHERE "id" = $2`,
                        manualVal, id
                    );
                } catch (rawErr: any) {
                    console.error('Raw SQL Fallback Failed:', rawErr.message);
                    // We don't return here because the main update already succeeded
                }
            }
        } catch (e: any) {
            console.error('DB_ERR:', e.message);
            return { success: false, error: `DB_ERR: ${e.message}` };
        }

        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: `GEN_ERR: ${e.message}` };
    }
}

export async function getCategories(businessId?: string | null) {
    try {
        const categories = await (prisma as any).productCategory.findMany({
            where: businessId ? { businessId } : undefined,
            orderBy: { name: 'asc' }
        });
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function getUnits(businessId?: string | null) {
    try {
        const units = await (prisma as any).productUnit.findMany({
            where: businessId ? { businessId } : undefined,
            orderBy: { name: 'asc' }
        });
        return units;
    } catch (error) {
        console.error('Get units error:', error);
        return [];
    }
}

export async function createCategory(name: string, businessId?: string | null) {
    try {
        const cat = await (prisma as any).productCategory.create({
            data: { name, businessId }
        });
        revalidatePath('/admin/inventory');
        return { success: true, category: cat };
    } catch (error) {
        console.error('Create category error:', error);
        return { error: 'Failed to create category' };
    }
}

export async function createUnit(name: string, businessId?: string | null) {
    try {
        const unit = await (prisma as any).productUnit.create({
            data: { name, businessId }
        });
        revalidatePath('/admin/inventory');
        return { success: true, unit };
    } catch (error) {
        console.error('Create unit error:', error);
        return { error: 'Failed to create unit' };
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
                const cost = parseFloat(row.cost || '0') || 0;
                const manualPrice = (row.price !== undefined && row.price !== '') ? parseFloat(row.price) : null;
                const price = manualPrice !== null ? manualPrice : (cost ? cost * 1.4 : null);
                
                const isPriceManual = row.isPriceManual ?? (manualPrice !== null);
                
                const p = await tx.product.create({
                    data: {
                        name: row.name,
                        sku: row.sku,
                        barcode: finalBarcode,
                        price: price,
                        cost: cost,
                        categoryId: row.categoryId || null,
                        unitId: row.unitId || null,
                        businessId
                    }
                });

                // Raw SQL fallback for the new field
                try {
                    await (tx as any).$executeRawUnsafe(
                        `UPDATE "Product" SET "isPriceManual" = $1 WHERE "id" = $2`,
                        isPriceManual, p.id
                    );
                } catch (rawErr) {
                    console.error('Raw Fallback in Bulk Create Failed:', rawErr);
                }

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
