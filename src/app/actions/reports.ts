'use server';

import { prisma } from '@/lib/prisma';
import { getBusinessFilter } from './business';
import { sanitizeData } from '@/lib/utils';

export async function getInvoiceItemReport(filters: {
    productId?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const businessFilter = await getBusinessFilter();
    
    const where: any = {
        invoice: {
            ...businessFilter
        }
    };

    if (filters.productId) {
        where.productId = filters.productId;
    }

    if (filters.supplierId) {
        where.invoice.supplierId = filters.supplierId;
    }

    if (filters.startDate || filters.endDate) {
        where.invoice.date = {};
        if (filters.startDate) {
            where.invoice.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            where.invoice.date.lte = end;
        }
    }

    try {
        const items = await prisma.invoiceItem.findMany({
            where,
            include: {
                invoice: {
                    include: {
                        supplier: true,
                        warehouse: true,
                        shop: true
                    }
                },
                product: true
            },
            orderBy: {
                invoice: {
                    date: 'desc'
                }
            }
        });

        return sanitizeData(items);
    } catch (error) {
        console.error('Error fetching invoice item report:', error);
        return [];
    }
}

export async function getSaleItemReport(filters: {
    productId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const businessFilter = await getBusinessFilter();
    
    const where: any = {
        sale: {
            ...businessFilter
        }
    };

    if (filters.productId) {
        where.productId = filters.productId;
    }

    if (filters.startDate || filters.endDate) {
        where.sale.date = {};
        if (filters.startDate) {
            where.sale.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            where.sale.date.lte = end;
        }
    }

    try {
        const items = await prisma.saleItem.findMany({
            where,
            include: {
                sale: {
                    include: {
                        shop: true,
                        customer: true
                    }
                },
                product: true
            },
            orderBy: {
                sale: {
                    date: 'desc'
                }
            }
        });

        return sanitizeData(items);
    } catch (error) {
        console.error('Error fetching sale item report:', error);
        return [];
    }
}
