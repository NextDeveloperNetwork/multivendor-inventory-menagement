'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logActivity } from './intelligence';

export async function getSalesManagerProducts(businessId: string | null) {
    const products = await prisma.product.findMany({
        where: businessId ? { businessId } : {},
        include: {
            inventory: {
                include: {
                    warehouse: true,
                    shop: true
                }
            },
            unit: true,
            category: true
        },
        orderBy: { name: 'asc' }
    });
    return products;
}

export async function processSalesManagerSale(data: {
    businessId: string | null;
    warehouseId: string;
    customerId?: string;
    items: { productId: string; quantity: number; price: number }[];
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Unauthorized' };

    let { businessId, warehouseId, items, customerId } = data;

    // Resolve businessId from warehouse if null
    if (!businessId) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: warehouseId }
        });
        businessId = warehouse?.businessId || null;
    }

    // Fallback if still null (required by schema)
    if (!businessId) {
        const firstBusiness = await prisma.business.findFirst();
        businessId = firstBusiness?.id || null;
    }

    if (!businessId) return { error: 'No business context available for sale' };

    if (items.length === 0) return { error: 'No items selected' };

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get/Create Global Customer if none
            let effectiveCustomerId = customerId;
            if (!effectiveCustomerId) {
                const walkIn = await tx.customer.findFirst({
                    where: { name: 'Direct Sales Customer', businessId: businessId || undefined }
                });
                if (walkIn) effectiveCustomerId = walkIn.id;
                else {
                    const newWalkIn = await tx.customer.create({
                        data: { name: 'Direct Sales Customer', businessId: businessId || undefined, email: 'direct@system.local' }
                    });
                    effectiveCustomerId = newWalkIn.id;
                }
            }

            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const count = await tx.sale.count();
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const trxNumber = `SM${dateStr}${String(count + 1).padStart(4, '0')}`;

            // 2. Create Sale
            const sale = await (tx as any).sale.create({
                data: {
                    number: trxNumber,
                    businessId: businessId || undefined,
                    warehouse: warehouseId ? { connect: { id: warehouseId } } : undefined,
                    user: { connect: { id: session.user.id } },
                    customer: effectiveCustomerId ? { connect: { id: effectiveCustomerId } } : undefined,
                    total,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });

            // 3. Deduct Inventory from Warehouse
            for (const item of items) {
                const inv = await tx.inventory.findUnique({
                    where: {
                        productId_warehouseId: { productId: item.productId, warehouseId }
                    }
                });

                if (!inv || inv.quantity < item.quantity) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    throw new Error(`Insufficient stock for ${product?.name || item.productId} in selected warehouse`);
                }

                await tx.inventory.update({
                    where: { id: inv.id },
                    data: { quantity: { decrement: item.quantity } }
                });
            }

            // 4. Log Activity
            await logActivity({
                action: 'SALES_MANAGER_SALE',
                entityType: 'SALE',
                entityId: sale.id,
                details: `Sales Manager recorded direct sale #${sale.number} from warehouse. Total: ${total}`,
                businessId: businessId || undefined
            } as any);

            return sale;
        });

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/production/inventory');
        return { success: true, saleId: result.id };
    } catch (e: any) {
        console.error('Sales Manager Sale Error:', e);
        return { error: e.message || 'Operation failed' };
    }
}

export async function deleteSalesManagerSale(saleId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id: saleId },
                include: { items: true }
            });

            if (!sale) throw new Error('Sale not found');
            if (!(sale as any).warehouseId) throw new Error('Only warehouse sales can be deleted here');

            // Return items to inventory
            for (const item of sale.items) {
                const inv = await tx.inventory.findUnique({
                    where: {
                        productId_warehouseId: { 
                            productId: item.productId, 
                            warehouseId: (sale as any).warehouseId 
                        }
                    }
                });

                if (inv) {
                    await tx.inventory.update({
                        where: { id: inv.id },
                        data: { quantity: { increment: item.quantity } }
                    });
                }
            }

            // Delete sale (Prisma cascade delete should handle items)
            await tx.saleItem.deleteMany({ where: { saleId } });
            await tx.sale.delete({ where: { id: saleId } });

            await logActivity({
                action: 'DELETE_SALE',
                entityType: 'SALE',
                entityId: saleId,
                details: `Admin deleted sale #${sale.number} and restored stock to warehouse.`,
                businessId: (sale as any).businessId
            } as any);
        });

        revalidatePath('/admin/sales-manager-inputs');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (e: any) {
        console.error('Delete Sale Error:', e);
        return { error: e.message || 'Failed to delete sale' };
    }
}
