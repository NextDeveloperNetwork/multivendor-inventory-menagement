'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Get shop details with sales and low stock items
export async function getShopDetails(shopId: string) {
    try {
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            include: {
                inventory: {
                    include: {
                        product: true
                    },
                    orderBy: { quantity: 'asc' }
                },
                sales: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!shop) {
            return { error: 'Shop not found' };
        }

        // Get low stock items (quantity < 10)
        const lowStockItems = shop.inventory.filter(inv => inv.quantity < 10);

        // Calculate sales data
        const salesData = shop.sales.map(sale => ({
            id: sale.id,
            date: sale.createdAt,
            total: sale.total,
            itemCount: sale.items.length,
            items: sale.items.map(item => ({
                productName: item.product.name,
                quantity: item.quantity,
                price: item.price
            }))
        }));

        return {
            shop: {
                id: shop.id,
                name: shop.name,
                latitude: shop.latitude,
                longitude: shop.longitude
            },
            sales: salesData,
            lowStockItems: lowStockItems.map(inv => ({
                productId: inv.product.id,
                productName: inv.product.name,
                sku: inv.product.sku,
                quantity: inv.quantity,
                sellingPrice: inv.product.price
            }))
        };
    } catch (error) {
        console.error('Error fetching shop details:', error);
        return { error: 'Failed to fetch shop details' };
    }
}

// Get warehouse details with inventory and low stock items
export async function getWarehouseDetails(warehouseId: string) {
    try {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: warehouseId },
            include: {
                inventory: {
                    include: {
                        product: true
                    },
                    orderBy: { product: { name: 'asc' } }
                }
            }
        });

        if (!warehouse) {
            return { error: 'Warehouse not found' };
        }

        // Get low stock items (quantity < 20 for warehouses)
        const lowStockItems = warehouse.inventory.filter(inv => inv.quantity < 20);

        return {
            warehouse: {
                id: warehouse.id,
                name: warehouse.name,
                latitude: warehouse.latitude,
                longitude: warehouse.longitude
            },
            inventoryOnHand: warehouse.inventory.map(inv => ({
                productId: inv.product.id,
                productName: inv.product.name,
                sku: inv.product.sku,
                quantity: inv.quantity,
                costPrice: inv.product.cost
            })),
            lowStockItems: lowStockItems.map(inv => ({
                productId: inv.product.id,
                productName: inv.product.name,
                sku: inv.product.sku,
                quantity: inv.quantity,
                costPrice: inv.product.cost
            }))
        };
    } catch (error) {
        console.error('Error fetching warehouse details:', error);
        return { error: 'Failed to fetch warehouse details' };
    }
}

// Get supplier details with supplied products and invoices
export async function getSupplierDetails(supplierId: string) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: {
                invoices: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!supplier) {
            return { error: 'Supplier not found' };
        }

        // Get unique products supplied
        const suppliedProducts = new Map();
        supplier.invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                if (!suppliedProducts.has(item.product.id)) {
                    suppliedProducts.set(item.product.id, {
                        productId: item.product.id,
                        productName: item.product.name,
                        sku: item.product.sku,
                        totalQuantity: 0,
                        lastCost: item.cost
                    });
                }
                const product = suppliedProducts.get(item.product.id);
                product.totalQuantity += item.quantity;
                product.lastCost = item.cost;
            });
        });

        return {
            supplier: {
                id: supplier.id,
                name: supplier.name,
                email: supplier.email,
                latitude: supplier.latitude,
                longitude: supplier.longitude
            },
            suppliedGoods: Array.from(suppliedProducts.values()),
            recentInvoices: supplier.invoices.map(invoice => {
                const total = invoice.items.reduce((sum: number, item: any) => sum + (Number(item.cost) * item.quantity), 0);
                return {
                    id: invoice.id,
                    number: invoice.number,
                    date: invoice.createdAt,
                    total,
                    itemCount: invoice.items.length
                };
            })
        };
    } catch (error) {
        console.error('Error fetching supplier details:', error);
        return { error: 'Failed to fetch supplier details' };
    }
}
