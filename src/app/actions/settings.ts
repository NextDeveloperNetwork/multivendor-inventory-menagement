'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCurrency(data: {
    code: string;
    name: string;
    symbol: string;
    rate: number;
    isBase: boolean;
}) {
    try {
        if (data.isBase) {
            // Unset other base currencies if this is the new base
            await prisma.currency.updateMany({
                where: { isBase: true },
                data: { isBase: false }
            });
        }

        const currency = await prisma.currency.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                symbol: data.symbol,
                rate: data.rate,
                isBase: data.isBase
            }
        });

        revalidatePath('/admin/currencies');
        return currency;
    } catch (error) {
        console.error('Error creating currency:', error);
        return { error: 'Failed to create currency' };
    }
}

export async function updateCurrency(id: string, data: {
    code: string;
    name: string;
    symbol: string;
    rate: number;
    isBase: boolean;
}) {
    try {
        if (data.isBase) {
            await prisma.currency.updateMany({
                where: { isBase: true },
                data: { isBase: false }
            });
        }

        const currency = await prisma.currency.update({
            where: { id },
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                symbol: data.symbol,
                rate: data.rate,
                isBase: data.isBase
            }
        });

        revalidatePath('/admin/currencies');
        return currency;
    } catch (error) {
        console.error('Error updating currency:', error);
        return { error: 'Failed to update currency' };
    }
}

export async function deleteCurrency(id: string) {
    try {
        await prisma.currency.delete({
            where: { id }
        });
        revalidatePath('/admin/currencies');
        return { success: true };
    } catch (error) {
        console.error('Error deleting currency:', error);
        return { error: 'Failed to delete currency' };
    }
}

export async function getCurrencies() {
    return prisma.currency.findMany({
        orderBy: { code: 'asc' }
    });
}
