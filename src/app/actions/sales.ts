'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface CartItem {
    productId: string;
    quantity: number;
    price: number;
}

export async function processSale(items: CartItem[]) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId || !session?.user?.id) {
        return { error: 'Unauthorized or Shop not assigned' };
    }

    const shopId = session.user.shopId;
    const userId = session.user.id;

    if (items.length === 0) {
        return { error: 'Cart is empty' };
    }

    // Calculate total server side to be safe, but for now trusting input price/quantity for speed
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        await prisma.$transaction(async (tx) => {
            // Fetch shop currency for snapshot
            const shop = await tx.shop.findUnique({
                where: { id: shopId },
                include: { currency: true }
            });

            // Generate numerical transaction number (YYMMDD + random 4 digits + sequence)
            const count = await tx.sale.count();
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const trxNumber = `${dateStr}${String(count + 1).padStart(4, '0')}`;

            // 1. Create Sale with currency snapshot
            const sale = await tx.sale.create({
                data: {
                    number: trxNumber,
                    shopId,
                    userId,
                    total,
                    currencyCode: shop?.currency?.code,
                    currencySymbol: shop?.currency?.symbol,
                    currencyRate: shop?.currency?.rate,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });

            // 2. Decrement Inventory
            for (const item of items) {
                // Find existing inventory entry for this shop
                const inventory = await tx.inventory.findUnique({
                    where: {
                        productId_shopId: {
                            productId: item.productId,
                            shopId: shopId
                        }
                    }
                });

                if (!inventory || inventory.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for Product ID ${item.productId}`);
                }

                await tx.inventory.update({
                    where: { id: inventory.id },
                    data: {
                        quantity: { decrement: item.quantity }
                    }
                });
            }
        });

        revalidatePath('/shop');
        revalidatePath('/shop/history');
        revalidatePath('/shop/inventory');
        return { success: true };
    } catch (error: any) {
        console.error('Sale Processing Error:', error);
        return { error: error.message || 'Transaction failed' };
    }
}

export async function deleteSale(id: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!sale) {
            return { error: 'Sale not found' };
        }

        // Verify Ownership
        if (sale.shopId !== session.user.shopId && session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized to delete this sale' };
        }

        await prisma.$transaction(async (tx) => {
            // 2. Revert Inventory
            for (const item of sale.items) {
                await tx.inventory.update({
                    where: {
                        productId_shopId: {
                            productId: item.productId,
                            shopId: sale.shopId
                        }
                    },
                    data: {
                        quantity: { increment: item.quantity }
                    }
                });
            }

            // 3. Delete Sale Items
            await tx.saleItem.deleteMany({
                where: { saleId: id }
            });

            // 4. Delete Sale
            await tx.sale.delete({
                where: { id }
            });
        });

        revalidatePath('/shop');
        revalidatePath('/shop/history');
        revalidatePath('/shop/inventory');
        revalidatePath('/admin');
        revalidatePath(`/admin/shops/${sale.shopId}`);

        return { success: true };
    } catch (error: any) {
        console.error('Delete Sale Error:', error);
        return { error: error.message || 'Failed to delete sale' };
    }
}
