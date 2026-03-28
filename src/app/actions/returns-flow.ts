'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from './intelligence';

/**
 * Processes a partial return by creating a NEW transfer representing the return shipment.
 */
export async function processPartialReturn(transferId: string, returns: { itemId: string, returnedQty: number, reason?: string, productId: string }[]) {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized Access' };

    try {
        const result = await (prisma as any).$transaction(async (tx: any) => {
            const originalTransfer = await tx.transfer.findUnique({
                where: { id: transferId },
                include: { items: true }
            });

            if (!originalTransfer) throw new Error('Original manifest not found');

            // 0. Fetch prices for recalculation
            const productIds = returns.map(ret => ret.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } }
            });

            const returnValue = returns.reduce((sum, ret) => {
                const product = products.find((p: any) => p.id === ret.productId);
                return sum + (Number(product?.price || 0) * ret.returnedQty);
            }, 0);

            const newTotalAmount = Math.max(0, Number((originalTransfer as any).totalAmount || 0) - returnValue);

            // 1. Update the original items to reflect the return in logs
            for (const item of returns) {
                await tx.transferItem.update({
                    where: { id: item.itemId },
                    data: {
                        returnedQuantity: item.returnedQty,
                        returnReason: item.reason || 'PARTIAL_REJECTION'
                    }
                });

                // 2. DEDUCT from Shop (The original destination node)
                // because they are returning these goods, they don't have them anymore
                const shopInv = await tx.inventory.findFirst({
                    where: originalTransfer.toWarehouseId ? 
                        { productId: item.productId, warehouseId: originalTransfer.toWarehouseId } :
                        { productId: item.productId, shopId: originalTransfer.toShopId! }
                });

                if (shopInv) {
                    await tx.inventory.update({
                        where: { id: shopInv.id },
                        data: { quantity: { decrement: item.returnedQty } }
                    });
                }
            }

            // 3. Create the NEW Return Transfer (Reversed Route)
            const returnTransfer = await tx.transfer.create({
                data: {
                    businessId: originalTransfer.businessId,
                    fromWarehouseId: originalTransfer.toWarehouseId,
                    fromShopId: originalTransfer.toShopId,
                    toWarehouseId: originalTransfer.fromWarehouseId,
                    toShopId: originalTransfer.fromShopId,
                    transporterId: originalTransfer.transporterId,
                    driverId: (originalTransfer as any).driverId,
                    status: 'RETURN_PENDING',
                    isReturn: true,
                    parentTransferId: transferId,
                    totalAmount: returnValue, // The return manifest holds the value of rejected goods
                    items: {
                        create: returns.map(ret => ({
                            productId: ret.productId,
                            quantity: ret.returnedQty,
                            returnReason: ret.reason
                        }))
                    }
                }
            });

            // 4. Mark the original as partially returned and RECALCULATE financial amount
            await tx.transfer.update({
                where: { id: transferId },
                data: {
                    status: 'PARTIAL_RETURN',
                    totalAmount: newTotalAmount,
                    updatedAt: new Date()
                }
            });

            return returnTransfer;
        });

        await logActivity({
            action: 'TRANSFER_RETURN_GENERATED',
            entityType: 'TRANSFER',
            entityId: result.id,
            details: `New return manifest ${result.id} generated from parent ${transferId}. Inventory deducted from destination.`
        });

        revalidatePath('/transporter');
        revalidatePath('/admin/transfers');
        revalidatePath('/admin/inventory');
        revalidatePath('/shop');
        revalidatePath('/shop/inventory');
        revalidatePath('/shop/history');
        revalidatePath('/warehouse');
        revalidatePath('/warehouse/inventory');
        revalidatePath('/admin');
        
        return { success: true, returnId: result.id };
    } catch (e: any) {
        console.error(e);
        return { error: e.message || 'Reverse logistics generation failure' };
    }
}

/**
 * Reconciles a return transfer by accepting or rejecting it.
 */
export async function reconcileReturn(id: string, action: 'ACCEPT' | 'REJECT') {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized Access' };

    try {
        const result = await (prisma as any).$transaction(async (tx: any) => {
            const transfer = await tx.transfer.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!transfer || !(transfer as any).isReturn) throw new Error('Valid return manifest not found');

            if (action === 'ACCEPT') {
                // Restore to Destination (The hub receiving the return)
                for (const item of transfer.items) {
                    const destInv = await tx.inventory.findFirst({
                        where: transfer.toWarehouseId ? 
                            { productId: item.productId, warehouseId: transfer.toWarehouseId } :
                            { productId: item.productId, shopId: transfer.toShopId! }
                    });

                    if (destInv) {
                        await tx.inventory.update({
                            where: { id: destInv.id },
                            data: { quantity: { increment: item.quantity } }
                        });
                    } else {
                        await tx.inventory.create({
                            data: {
                                productId: item.productId,
                                warehouseId: transfer.toWarehouseId || null,
                                shopId: transfer.toShopId || null,
                                quantity: item.quantity
                            }
                        });
                    }
                }
                
                await tx.transfer.update({
                    where: { id },
                    data: { status: 'RETURN_ACCEPTED' }
                });
            }
 else {
                await tx.transfer.update({
                    where: { id },
                    data: { status: 'RETURN_REJECTED' }
                });
            }

            return { success: true };
        });

        revalidatePath('/admin/transfers');
        revalidatePath('/admin/inventory');
        return result;
    } catch (e: any) {
        console.error(e);
        return { error: e.message || 'Return reconciliation failure' };
    }
}

/**
 * Updates the financial settlement status of a transfer.
 */
export async function updatePaymentStatus(id: string, isPaid: boolean) {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized Access' };

    try {
        await (prisma as any).transfer.update({
            where: { id },
            data: {
                isPaid,
                paidAt: isPaid ? new Date() : null,
                status: isPaid ? 'DELIVERED' : undefined
            }
        });

        revalidatePath('/admin/transfers');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Payment status synchronization failure' };
    }
}
