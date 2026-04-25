'use server';

import { prisma } from '@/lib/prisma';
import { getBusinessFilter } from '@/app/actions/business';
import { revalidatePath } from 'next/cache';

// ── CATEGORIES ──────────────────────────────────────────────

export async function getCategories() {
    const bf = await getBusinessFilter();
    const cats = await (prisma as any).productCategory.findMany({
        where: bf,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
    });
    return cats;
}

export async function createCategory(name: string) {
    const bf = await getBusinessFilter();
    const businessId = (bf as any).businessId ?? null;
    await (prisma as any).productCategory.create({ data: { name, businessId } });
    revalidatePath('/admin/inventory');
    return { success: true };
}

export async function updateCategory(id: string, name: string) {
    await (prisma as any).productCategory.update({ where: { id }, data: { name } });
    revalidatePath('/admin/inventory');
    return { success: true };
}

export async function deleteCategory(id: string) {
    try {
        await (prisma as any).productCategory.delete({ where: { id } });
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: 'Cannot delete — products still use this category.' };
    }
}

// ── UNITS ────────────────────────────────────────────────────

export async function getUnits() {
    const bf = await getBusinessFilter();
    const units = await (prisma as any).productUnit.findMany({
        where: bf,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
    });
    return units;
}

export async function createUnit(name: string) {
    const bf = await getBusinessFilter();
    const businessId = (bf as any).businessId ?? null;
    await (prisma as any).productUnit.create({ data: { name, businessId } });
    revalidatePath('/admin/inventory');
    return { success: true };
}

export async function updateUnit(id: string, name: string) {
    await (prisma as any).productUnit.update({ where: { id }, data: { name } });
    revalidatePath('/admin/inventory');
    return { success: true };
}

export async function deleteUnit(id: string) {
    try {
        await (prisma as any).productUnit.delete({ where: { id } });
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: 'Cannot delete — products still use this unit.' };
    }
}
