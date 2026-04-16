'use server';
// Sales Management Operations - Force Re-sync 1.0

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSelectedBusinessId } from './business';

export async function createInventoryRequest(data: {
    productId: string;
    quantity: number;
    requestedBy: string;
    warehouseId?: string;
    shopId?: string;
    notes?: string;
}) {
    const businessId = await getSelectedBusinessId();
    
    try {
        const request = await (prisma as any).inventoryRequest.create({
            data: {
                ...data,
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
}) {
    const businessId = await getSelectedBusinessId();
    
    try {
        const debtor = await (prisma as any).debtor.create({
            data: {
                ...data,
                businessId,
                status: 'UNPAID',
                paidAmount: 0
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
        orderBy: { createdAt: 'desc' }
    });
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
