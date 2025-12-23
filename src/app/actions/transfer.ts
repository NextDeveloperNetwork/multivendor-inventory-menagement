'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createTransfer(formData: FormData) {
    const fromType = formData.get('fromType') as 'warehouse' | 'shop';
    const fromId = formData.get('fromId') as string;
    const toType = formData.get('toType') as 'warehouse' | 'shop';
    const toId = formData.get('toId') as string;
    const items = JSON.parse(formData.get('items') as string);

    try {
        const transferData: any = {
            status: 'COMPLETED',
            items: {
                create: items.map((item: any) => ({
                    productId: item.productId,
                    quantity: parseInt(item.quantity),
                })),
            },
        };

        if (fromType === 'warehouse') transferData.fromWarehouseId = fromId;
        else transferData.fromShopId = fromId;

        if (toType === 'warehouse') transferData.toWarehouseId = toId;
        else transferData.toShopId = toId;

        const transfer = await prisma.transfer.create({
            data: transferData,
            include: {
                items: { include: { product: true } },
                fromWarehouse: true,
                fromShop: true,
                toWarehouse: true,
                toShop: true,
            },
        });

        // Update inventories
        for (const item of items) {
            const quantity = parseInt(item.quantity);

            // 1. Deduct from Source
            const sourceWhere: any = { productId: item.productId };
            if (fromType === 'warehouse') sourceWhere.warehouseId = fromId;
            else sourceWhere.shopId = fromId;

            const sourceInv = await prisma.inventory.findUnique({
                where: fromType === 'warehouse' ?
                    { productId_warehouseId: { productId: item.productId, warehouseId: fromId } } :
                    { productId_shopId: { productId: item.productId, shopId: fromId } }
            });

            if (sourceInv) {
                await prisma.inventory.update({
                    where: { id: sourceInv.id },
                    data: { quantity: { decrement: quantity } },
                });
            }

            // 2. Add to Destination
            const destInv = await prisma.inventory.findUnique({
                where: toType === 'warehouse' ?
                    { productId_warehouseId: { productId: item.productId, warehouseId: toId } } :
                    { productId_shopId: { productId: item.productId, shopId: toId } }
            });

            if (destInv) {
                await prisma.inventory.update({
                    where: { id: destInv.id },
                    data: { quantity: { increment: quantity } },
                });
            } else {
                await prisma.inventory.create({
                    data: {
                        productId: item.productId,
                        warehouseId: toType === 'warehouse' ? toId : null,
                        shopId: toType === 'shop' ? toId : null,
                        quantity,
                    },
                });
            }
        }

        revalidatePath('/admin/transfers');
        revalidatePath('/admin/inventory');
        revalidatePath('/shop');
        revalidatePath('/shop/inventory');
        revalidatePath('/shop/history');
        return { success: true, transfer };
    } catch (error) {
        console.error('Error creating transfer:', error);
        return { success: false, error: 'Failed to create transfer' };
    }
}

export async function getTransfers() {
    try {
        const transfers = await prisma.transfer.findMany({
            include: {
                items: { include: { product: true } },
                fromWarehouse: true,
                fromShop: true,
                toWarehouse: true,
                toShop: true,
            },
            orderBy: { date: 'desc' },
        });
        return transfers;
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return [];
    }
}

export async function getTransferById(id: string) {
    try {
        const transfer = await prisma.transfer.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                fromWarehouse: true,
                fromShop: true,
                toWarehouse: true,
                toShop: true,
            },
        });
        return transfer;
    } catch (error) {
        console.error('Error fetching transfer:', error);
        return null;
    }
}

export async function deleteTransfer(id: string) {
    try {
        // 1. Fetch transfer with items to know what to rollback
        const transfer = await prisma.transfer.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!transfer) {
            return { success: false, error: 'Transfer not found' };
        }

        // 2. Perform rollback in a transaction
        await prisma.$transaction(async (tx) => {
            for (const item of transfer.items) {
                // Rollback Source (Add back)
                if (transfer.fromWarehouseId) {
                    await tx.inventory.update({
                        where: { productId_warehouseId: { productId: item.productId, warehouseId: transfer.fromWarehouseId } },
                        data: { quantity: { increment: item.quantity } }
                    });
                } else if (transfer.fromShopId) {
                    await tx.inventory.update({
                        where: { productId_shopId: { productId: item.productId, shopId: transfer.fromShopId } },
                        data: { quantity: { increment: item.quantity } }
                    });
                }

                // Rollback Destination (Deduct)
                if (transfer.toWarehouseId) {
                    await tx.inventory.update({
                        where: { productId_warehouseId: { productId: item.productId, warehouseId: transfer.toWarehouseId } },
                        data: { quantity: { decrement: item.quantity } }
                    });
                } else if (transfer.toShopId) {
                    await tx.inventory.update({
                        where: { productId_shopId: { productId: item.productId, shopId: transfer.toShopId } },
                        data: { quantity: { decrement: item.quantity } }
                    });
                }
            }

            // 3. Delete items and transfer
            await tx.transferItem.deleteMany({ where: { transferId: id } });
            await tx.transfer.delete({ where: { id } });
        });

        revalidatePath('/admin/transfers');
        revalidatePath('/admin/inventory');
        revalidatePath('/shop/inventory');

        return { success: true };
    } catch (error) {
        console.error('Error deleting transfer:', error);
        return { success: false, error: 'Failed to delete transfer and rollback inventory' };
    }
}

export async function updateTransfer(id: string, formData: FormData) {
    const fromType = formData.get('fromType') as 'warehouse' | 'shop';
    const fromId = formData.get('fromId') as string;
    const toType = formData.get('toType') as 'warehouse' | 'shop';
    const toId = formData.get('toId') as string;
    const items = JSON.parse(formData.get('items') as string);

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Fetch original transfer
            const originalTransfer = await tx.transfer.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!originalTransfer) throw new Error('Transfer not found');

            // 2. Rollback original manifest inventory
            for (const item of originalTransfer.items) {
                // Return to source
                if (originalTransfer.fromWarehouseId) {
                    await tx.inventory.update({
                        where: { productId_warehouseId: { productId: item.productId, warehouseId: originalTransfer.fromWarehouseId } },
                        data: { quantity: { increment: item.quantity } }
                    });
                } else if (originalTransfer.fromShopId) {
                    await tx.inventory.update({
                        where: { productId_shopId: { productId: item.productId, shopId: originalTransfer.fromShopId } },
                        data: { quantity: { increment: item.quantity } }
                    });
                }
                // Deduct from destination
                if (originalTransfer.toWarehouseId) {
                    await tx.inventory.update({
                        where: { productId_warehouseId: { productId: item.productId, warehouseId: originalTransfer.toWarehouseId } },
                        data: { quantity: { decrement: item.quantity } }
                    });
                } else if (originalTransfer.toShopId) {
                    await tx.inventory.update({
                        where: { productId_shopId: { productId: item.productId, shopId: originalTransfer.toShopId } },
                        data: { quantity: { decrement: item.quantity } }
                    });
                }
            }

            // 3. Delete old items
            await tx.transferItem.deleteMany({ where: { transferId: id } });

            // 4. Update Transfer Record
            const transferData: any = {
                fromWarehouseId: fromType === 'warehouse' ? fromId : null,
                fromShopId: fromType === 'shop' ? fromId : null,
                toWarehouseId: toType === 'warehouse' ? toId : null,
                toShopId: toType === 'shop' ? toId : null,
            };

            await tx.transfer.update({
                where: { id },
                data: transferData
            });

            // 5. Apply new manifest inventory & create items
            for (const item of items) {
                const qty = parseInt(item.quantity);

                // Deduct from new source
                const sourceWhere = fromType === 'warehouse' ?
                    { productId_warehouseId: { productId: item.productId, warehouseId: fromId } } :
                    { productId_shopId: { productId: item.productId, shopId: fromId } };

                await tx.inventory.update({
                    where: sourceWhere as any,
                    data: { quantity: { decrement: qty } }
                });

                // Add to new destination
                const destInv = await tx.inventory.findUnique({
                    where: (toType === 'warehouse' ?
                        { productId_warehouseId: { productId: item.productId, warehouseId: toId } } :
                        { productId_shopId: { productId: item.productId, shopId: toId } }) as any
                });

                if (destInv) {
                    await tx.inventory.update({
                        where: { id: destInv.id },
                        data: { quantity: { increment: qty } }
                    });
                } else {
                    await tx.inventory.create({
                        data: {
                            productId: item.productId,
                            warehouseId: toType === 'warehouse' ? toId : null,
                            shopId: toType === 'shop' ? toId : null,
                            quantity: qty
                        }
                    });
                }

                // Create Item
                await tx.transferItem.create({
                    data: {
                        transferId: id,
                        productId: item.productId,
                        quantity: qty
                    }
                });
            }
        });

        revalidatePath('/admin/transfers');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating transfer:', error);
        return { success: false, error: error.message || 'Failed to update transfer' };
    }
}
