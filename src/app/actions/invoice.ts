'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeData } from '@/lib/utils';

export async function createInvoice(formData: FormData) {
    const supplierId = formData.get('supplierId') as string;
    const items = JSON.parse(formData.get('items') as string);

    const manualNumber = formData.get('number') as string;
    const warehouseId = formData.get('warehouseId') as string;
    const shopId = formData.get('shopId') as string;
    const date = formData.get('date') as string;

    // Validation: Require either warehouseId OR shopId, but not both or neither
    if ((!warehouseId && !shopId) || (warehouseId && shopId)) {
        return { success: false, error: 'Please select either a Warehouse or a Shop as destination.' };
    }

    try {
        let invoiceNumber = manualNumber;

        if (!invoiceNumber) {
            // Generate numerical invoice number (YYYYMMDDXXXX) as fallback
            const count = await prisma.invoice.count();
            const now = date ? new Date(date) : new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            invoiceNumber = `${dateStr}${String(count + 1).padStart(4, '0')}`;
        }

        const invoice = await prisma.invoice.create({
            data: {
                number: invoiceNumber,
                date: date ? new Date(date) : undefined,
                warehouse: warehouseId ? { connect: { id: warehouseId } } : undefined,
                shop: shopId ? { connect: { id: shopId } } : undefined,
                supplier: (supplierId ? { connect: { id: supplierId } } : undefined) as any,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        cost: parseFloat(item.cost),
                    })),
                },
            } as any,
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            } as any, // Cast to any to resolve generic inference issue with generated client
        });

        // Update inventory
        for (const item of items) {
            const qtyToAdd = parseInt(item.quantity);
            const unitCost = parseFloat(item.cost);

            // Determine where to update stock
            if (shopId) {
                // Shop Inventory
                const existingInventory = await prisma.inventory.findUnique({
                    where: {
                        productId_shopId: {
                            productId: item.productId,
                            shopId: shopId,
                        }
                    },
                });

                if (existingInventory) {
                    await prisma.inventory.update({
                        where: { id: existingInventory.id },
                        data: { quantity: { increment: qtyToAdd } },
                    });
                } else {
                    await prisma.inventory.create({
                        data: {
                            productId: item.productId,
                            shopId: shopId,
                            quantity: qtyToAdd,
                        },
                    });
                }
            } else {
                // Warehouse Inventory
                const existingInventory = await prisma.inventory.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: item.productId,
                            warehouseId: warehouseId,
                        }
                    },
                });

                if (existingInventory) {
                    await prisma.inventory.update({
                        where: { id: existingInventory.id },
                        data: { quantity: { increment: qtyToAdd } },
                    });
                } else {
                    await prisma.inventory.create({
                        data: {
                            productId: item.productId,
                            warehouseId: warehouseId,
                            quantity: qtyToAdd,
                        },
                    });
                }
            }

            // Calculate Weighted Average Cost (WAC)
            // Note: WAC usually applies globally or per company.
            // Assuming cost tracking is per product global definition for now.
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { inventory: true }
            });

            if (product) {
                const currentTotalQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                const currentAvgCost = Number(product.cost);
                const prevTotalQty = currentTotalQty - qtyToAdd;

                let newAvgCost = unitCost;

                if (prevTotalQty > 0) {
                    // WAC = ((Old Qty * Old Avg Cost) + (New Qty * New Unit Cost)) / (Current Total Qty)
                    const oldTotalValue = prevTotalQty * currentAvgCost;
                    const newTotalValue = qtyToAdd * unitCost;
                    newAvgCost = (oldTotalValue + newTotalValue) / currentTotalQty;
                }

                let isPriceManual = false;
                try {
                    const [res]: any[] = await (prisma as any).$queryRawUnsafe(
                        `SELECT "isPriceManual" FROM "Product" WHERE "id" = $1`,
                        item.productId
                    );
                    if (res) isPriceManual = res.isPriceManual;
                } catch (e) {
                    console.error('Invoice Price Flag Check Failed:', e);
                }

                const updateData: any = {
                    cost: newAvgCost,
                };

                // Only update price if it's not manually set
                if (!isPriceManual) {
                    updateData.price = newAvgCost * 1.4;
                }

                await prisma.product.update({
                    where: { id: item.productId },
                    data: updateData
                });
            }
        }

        revalidatePath('/admin/invoices');
        revalidatePath('/admin/inventory');
        revalidatePath('/shop/inventory');
        return { success: true, invoice: sanitizeData(invoice) };
    } catch (error) {
        console.error('Error creating invoice:', error);
        return { success: false, error: 'Failed to create invoice' };
    }
}

export async function getInvoices() {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                supplier: true,
                warehouse: true,
                shop: true,
            } as any,
            orderBy: {
                date: 'desc',
            },
        });
        return invoices;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
}

export async function deleteInvoice(id: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!invoice) return { success: false, error: 'Invoice not found' };

        // We need to revert inventory from where it was added (Warehouse or Shop)
        const inv = invoice as any;

        await prisma.$transaction(async (tx) => {
            // Revert inventory
            if (inv.warehouseId) {
                for (const item of inv.items) {
                    const inventory = await tx.inventory.findUnique({
                        where: {
                            productId_warehouseId: {
                                productId: item.productId,
                                warehouseId: inv.warehouseId
                            }
                        }
                    });

                    if (inventory) {
                        await tx.inventory.update({
                            where: { id: inventory.id },
                            data: { quantity: { decrement: item.quantity } }
                        });
                    }
                }
            } else if (inv.shopId) {
                for (const item of inv.items) {
                    const inventory = await tx.inventory.findUnique({
                        where: {
                            productId_shopId: {
                                productId: item.productId,
                                shopId: inv.shopId
                            }
                        }
                    });

                    if (inventory) {
                        await tx.inventory.update({
                            where: { id: inventory.id },
                            data: { quantity: { decrement: item.quantity } }
                        });
                    }
                }
            }

            // Delete invoice items and invoice outside of the loop
            await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
            await tx.invoice.delete({ where: { id } });
        });

        revalidatePath('/admin/invoices');
        revalidatePath('/admin/inventory');
        revalidatePath('/shop/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return { success: false, error: 'Failed to delete invoice' };
    }
}

export async function getInvoiceById(id: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        return invoice;
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return null;
    }
}
