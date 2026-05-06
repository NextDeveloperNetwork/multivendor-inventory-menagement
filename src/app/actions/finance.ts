'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getBusinessFilter, getSelectedBusinessId } from './business';
import { logActivity } from './intelligence';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function getBudgets() {
    const filter = await getBusinessFilter();
    return prisma.financialBudget.findMany({
        where: filter as any,
        orderBy: { updatedAt: 'desc' }
    });
}

export async function createOrUpdateBudget(data: {
    id?: string;
    amount: number;
    period: string;
    description?: string;
}) {
    const session = await getServerSession(authOptions);
    const businessId = await getSelectedBusinessId();

    if (!businessId) {
        return { error: 'Business context required' };
    }

    try {
        let budget;
        if (data.id) {
            budget = await prisma.financialBudget.update({
                where: { id: data.id },
                data: {
                    amount: data.amount,
                    period: data.period,
                    description: data.description,
                    updatedBy: session?.user?.name || 'System'
                }
            });
        } else {
            budget = await prisma.financialBudget.create({
                data: {
                    amount: data.amount,
                    period: data.period,
                    description: data.description,
                    businessId,
                    updatedBy: session?.user?.name || 'System'
                } as any
            });
        }

        await logActivity({
            action: data.id ? 'BUDGET_UPDATED' : 'BUDGET_CREATED',
            entityType: 'FINANCIAL_BUDGET',
            entityId: budget.id,
            details: `Budget for ${data.period}: ${data.amount}`,
            userId: (session?.user as any)?.id
        });

        revalidatePath('/admin/budget');
        return { success: true, budget };
    } catch (error) {
        console.error('Budget operation error:', error);
        return { error: 'Failed to save budget' };
    }
}

export async function deleteBudget(id: string) {
    try {
        await prisma.financialBudget.delete({
            where: { id }
        });
        revalidatePath('/admin/budget');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete budget' };
    }
}
