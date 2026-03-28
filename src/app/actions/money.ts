'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getBusinessFilter } from './business';

export async function submitCashTransfer(data: {
    shopId: string;
    amount: number;
    type: 'TO_ADMIN' | 'FROM_ADMIN';
    reference?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');

    // Make sure we have the active shift to possibly attach to
    const activeShift = await prisma.shift.findFirst({
        where: { shopId: data.shopId, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
    });

    const transfer = await (prisma as any).cashTransfer.create({
        data: {
            shopId: data.shopId,
            shiftId: activeShift ? activeShift.id : null,
            amount: data.amount,
            type: data.type,
            reference: data.reference,
            status: 'PENDING',
        }
    });

    // Logging
    await prisma.activityLog.create({
        data: {
            businessId: (session.user as any).businessId || 'default',
            userId: session.user.id,
            action: 'SUBMIT_CASH_TRANSFER',
            entityType: 'CASH_TRANSFER',
            entityId: transfer.id,
            details: `Requested ${data.type} transfer of $${data.amount} for Shop ${data.shopId}`,
        }
    });

    revalidatePath('/shop/money');
    revalidatePath('/admin/finance');
    return transfer;
}

export async function updateCashTransferStatus(id: string, status: 'COMPLETED' | 'REJECTED') {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const transfer = await (prisma as any).cashTransfer.update({
        where: { id },
        data: { status }
    });

    // Logging
    await prisma.activityLog.create({
        data: {
            businessId: (session.user as any).businessId || 'default',
            userId: session.user.id,
            action: `CASH_TRANSFER_${status}`,
            entityType: 'CASH_TRANSFER',
            entityId: transfer.id,
            details: `Admin ${status.toLowerCase()} cash transfer of $${Number(transfer.amount)} (Ref: ${transfer.reference})`,
        }
    });

    revalidatePath('/admin/finance');
    revalidatePath('/shop/money');
    return transfer;
}

export async function sendFundsToShop(data: {
    shopId: string;
    amount: number;
    reference: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const transfer = await (prisma as any).cashTransfer.create({
        data: {
            shopId: data.shopId,
            amount: data.amount,
            type: 'FROM_ADMIN',
            reference: data.reference,
            status: 'COMPLETED',
        }
    });

    await prisma.activityLog.create({
        data: {
            businessId: (session.user as any).businessId || 'default',
            userId: session.user.id,
            action: 'ADMIN_FUND_TRANSFER',
            entityType: 'CASH_TRANSFER',
            entityId: transfer.id,
            details: `Admin sent float/funds of $${data.amount} to Shop ${data.shopId}`,
        }
    });

    revalidatePath('/admin/finance');
    revalidatePath('/shop/money');
    return transfer;
}

export async function getShopCashTransfers(shopId: string) {
    return (prisma as any).cashTransfer.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        include: {
            shift: true,
            shop: { select: { name: true } }
        }
    });
}

export async function getAllCashTransfers() {
    const filter = await getBusinessFilter();
    return (prisma as any).cashTransfer.findMany({
        where: filter ? { shop: filter as any } : {},
        orderBy: { createdAt: 'desc' },
        include: {
            shop: { select: { name: true, currency: true } },
            shift: true
        }
    });
}
