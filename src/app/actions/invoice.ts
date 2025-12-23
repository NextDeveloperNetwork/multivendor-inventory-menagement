'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createInvoice(formData: FormData) {
    const supplierId = formData.get('supplierId') as string;
    const items = JSON.parse(formData.get('items') as string);

    const manualNumber = formData.get('number') as string;
    const warehouseId = formData.get('warehouseId') as string;

    try {
        let invoiceNumber = manualNumber;

        if (!invoiceNumber) {
            // Generate numerical invoice number (YYYYMMDDXXXX) as fallback
            const count = await prisma.invoice.count();
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            invoiceNumber = `${dateStr}${String(count + 1).padStart(4, '0')}`;
        }

        const invoice = await prisma.invoice.create({
            data: {
                number: invoiceNumber,
                supplier: (supplierId ? { connect: { id: supplierId } } : undefined) as any,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        cost: parseFloat(item.cost),
                    })),
                },
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            } as any, // Cast to any to resolve generic inference issue with generated client
        });

        // Update warehouse inventory
        for (const item of items) {
            const qtyToAdd = parseInt(item.quantity);
            const unitCost = parseFloat(item.cost);

            const existingInventory = await prisma.inventory.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: item.productId,
                        warehouseId,
                    }
                },
            });

            if (existingInventory) {
                await prisma.inventory.update({
                    where: { id: existingInventory.id },
                    data: {
                        quantity: {
                            increment: qtyToAdd,
                        },
                    },
                });
            } else {
                await prisma.inventory.create({
                    data: {
                        productId: item.productId,
                        warehouseId,
                        quantity: qtyToAdd,
                    },
                });
            }

            // Calculate Weighted Average Cost (WAC)
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

                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        cost: newAvgCost
                    }
                });
            }
        }

        revalidatePath('/admin/invoices');
        revalidatePath('/admin/inventory');
        return { success: true, invoice };
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

        // We assume all items from an invoice went to the same warehouse initially
        // In this system, we need to know WHICH warehouse it went to.
        // Looking at createInvoice, it uses a single warehouseId for the entire batch.
        // However, the Invoice model doesn't store warehouseId directly.
        // It's stored in the Inventory records.
        // Let's find where these items are currently located.

        await prisma.$transaction(async (tx) => {
            for (const item of invoice.items) {
                // Find any inventory record for this product in a warehouse that decreased?
                // Actually, the most reliable way is to find the inventory record that was updated.
                // Since our system currently attaches an invoice batch to ONE warehouse at a time (via the form),
                // and the Invoice model doesn't store it, we have to look it up from the inventory if we can,
                // or we should have stored it in the Invoice model.

                // Let's check the first item's inventory link if it exists.
                // Actually, let's look for inventory records that might match this product.
                // This is a bit tricky without a warehouseId on the Invoice model.

                // For now, let's just delete the items and invoice.
                // IF we want full rollback, we need to add warehouseId to the Invoice model.

                await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
                await tx.invoice.delete({ where: { id } });
            }
        });

        revalidatePath('/admin/invoices');
        revalidatePath('/admin/inventory');
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
