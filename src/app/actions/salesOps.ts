'use server';
// Sales Management Operations - Force Re-sync 1.0

// Revalidation Timestamp: 2026-04-18 08:20
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSelectedBusinessId } from './business';

export async function createInventoryRequest(data: {
    productId?: string;
    productName?: string;
    quantity: number;
    requestedBy: string;
    warehouseId?: string;
    shopId?: string;
    notes?: string;
}) {
    const businessId = await getSelectedBusinessId();
    
    const payload = { ...data };
    if (!payload.productId) delete payload.productId;

    try {
        const request = await (prisma as any).inventoryRequest.create({
            data: {
                ...payload,
                businessId,
                status: 'PENDING'
            }
        });
        
        revalidatePath('/sales/requests');
        revalidatePath('/admin/sales/requests');
        return { success: true, requestId: request.id };
    } catch (e: any) {
        console.error('Inventory Request Error:', e);
        return { error: e.message || 'Failed to create request' };
    }
}

export async function createDebtor(data: {
    name: string;
    phone?: string;
    amount: number;
    notes?: string;
    debtDate?: string;
    items: { productName: string; quantity: number; price: number; total: number }[];
}) {
    const businessId = await getSelectedBusinessId();
    
    try {
        const debtor = await (prisma as any).debtor.create({
            data: {
                name: data.name,
                phone: data.phone,
                amount: data.amount,
                notes: data.notes,
                debtDate: data.debtDate ? new Date(data.debtDate) : new Date(),
                businessId,
                status: 'UNPAID',
                paidAmount: 0,
                items: {
                    create: data.items.map(item => ({
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.total
                    }))
                }
            }
        });
        
        revalidatePath('/sales/debtors');
        revalidatePath('/admin/sales/debtors');
        return { success: true, debtorId: debtor.id };
    } catch (e: any) {
        console.error('Debtor Registration Error:', e);
        return { error: e.message || 'Failed to register debtor' };
    }
}

export async function getInventoryRequests() {
    const businessId = await getSelectedBusinessId();
    return await (prisma as any).inventoryRequest.findMany({
        where: businessId ? { businessId } : {},
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getDebtors() {
    const businessId = await getSelectedBusinessId();
    return await (prisma as any).debtor.findMany({
        where: businessId ? { businessId } : {},
        include: { items: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateDebtor(id: string, data: {
    name: string;
    phone?: string;
    amount: number;
    notes?: string;
    debtDate?: string;
    items: { productName: string; quantity: number; price: number; total: number }[];
}) {
    try {
        await (prisma as any).$transaction([
            (prisma as any).debtorItem.deleteMany({
                where: { debtorId: id }
            }),
            (prisma as any).debtor.update({
                where: { id },
                data: {
                    name: data.name,
                    phone: data.phone,
                    amount: data.amount,
                    notes: data.notes,
                    debtDate: data.debtDate ? new Date(data.debtDate) : undefined,
                    items: {
                        create: data.items.map(item => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.total
                        }))
                    }
                }
            })
        ]);
        revalidatePath('/admin/sales/debtors');
        revalidatePath('/sales/debtors');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- Admin Control Actions ---

export async function updateRequestStatus(id: string, status: string) {
    try {
        await (prisma as any).inventoryRequest.update({
            where: { id },
            data: { status }
        });
        revalidatePath('/admin/sales/requests');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteRequest(id: string) {
    try {
        await (prisma as any).inventoryRequest.delete({ where: { id } });
        revalidatePath('/admin/sales/requests');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateRequest(id: string, data: {
    quantity?: number;
    productName?: string;
    notes?: string;
}) {
    try {
        await (prisma as any).inventoryRequest.update({
            where: { id },
            data
        });
        revalidatePath('/admin/sales/requests');
        revalidatePath('/sales/requests');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function recordPayment(id: string, amount: number) {
    try {
        const debtor = await (prisma as any).debtor.findUnique({ where: { id } });
        if (!debtor) throw new Error('Debtor not found');

        const newPaidAmount = Number(debtor.paidAmount) + amount;
        const totalAmount = Number(debtor.amount);
        
        let status = 'PARTIAL';
        if (newPaidAmount >= totalAmount) status = 'PAID';
        if (newPaidAmount <= 0) status = 'UNPAID';

        await (prisma as any).debtor.update({
            where: { id },
            data: { 
                paidAmount: newPaidAmount,
                status
            }
        });

        revalidatePath('/admin/sales/debtors');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteDebtor(id: string) {
    try {
        await (prisma as any).debtor.delete({ where: { id } });
        revalidatePath('/admin/sales/debtors');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- Free Sales Actions ---

export async function createFreeSale(data: {
    items: { productName: string; quantity: number; price: number; total: number }[];
    totalAmount: number;
    soldBy: string;
    notes?: string;
}) {
    if (!(prisma as any).freeSale) {
        throw new Error('Prisma client not updated. Please restart dev server.');
    }
    const businessId = await getSelectedBusinessId();
    try {
        await (prisma as any).freeSale.create({
            data: {
                totalAmount: data.totalAmount,
                soldBy: data.soldBy,
                notes: data.notes,
                businessId,
                items: {
                    create: data.items.map(item => ({
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.total
                    }))
                }
            }
        });
        revalidatePath('/sales/free-sales');
        revalidatePath('/admin/sales/free-sales');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Failed to register sale' };
    }
}

export async function getFreeSales() {
    if (!(prisma as any).freeSale) {
        console.error('Prisma client missing freeSale model');
        return [];
    }
    const businessId = await getSelectedBusinessId();
    try {
        return await (prisma as any).freeSale.findMany({
            where: businessId ? { businessId } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    } catch (e: any) {
        console.error('Fetch Free Sales Error:', e);
        return [];
    }
}

export async function updateFreeSale(id: string, data: {
    items: { productName: string; quantity: number; price: number; total: number }[];
    totalAmount: number;
    notes?: string;
}) {
    if (!(prisma as any).freeSale) {
        throw new Error('Prisma client not updated. Please restart dev server.');
    }
    try {
        await (prisma as any).$transaction([
            // Clear existing items
            (prisma as any).freeSaleItem.deleteMany({
                where: { freeSaleId: id }
            }),
            // Update header and recreate items
            (prisma as any).freeSale.update({
                where: { id },
                data: {
                    totalAmount: data.totalAmount,
                    notes: data.notes,
                    items: {
                        create: data.items.map(item => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.total
                        }))
                    }
                }
            })
        ]);
        revalidatePath('/sales/free-sales');
        revalidatePath('/admin/sales/free-sales');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Failed to update sale' };
    }
}

export async function deleteFreeSale(id: string) {
    try {
        await (prisma as any).freeSale.delete({ where: { id } });
        revalidatePath('/admin/sales/free-sales');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
