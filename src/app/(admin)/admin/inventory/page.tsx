import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Search, List, Package } from 'lucide-react';
import { Prisma } from '@prisma/client';
import InventoryFilter from '@/components/InventoryFilter';
import { sanitizeData } from '@/lib/utils';
import InventoryClient from '@/components/InventoryClient';
import BulkUploadDialog from '@/components/BulkUploadDialog';

import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

interface InventoryPageProps {
    searchParams: Promise<{
        filter?: string;
        shopId?: string;
        warehouseId?: string;
        q?: string;
        categoryId?: string;
    }>
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
    const params = await searchParams;
    const { filter = 'all', shopId, warehouseId, q = '', categoryId } = params;

    const businessFilter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();

    const [rawProducts, rawShops, rawWarehouses, rawCategories, baseCurrency] = await Promise.all([
        (prisma as any).product.findMany({
            where: {
                ...businessFilter,
                ...(q ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { sku: { contains: q, mode: 'insensitive' } }
                    ]
                } : {}),
                ...(categoryId ? { categoryId } : {})
            },
            orderBy: { name: 'asc' },
            include: {
                inventory: {
                    include: { shop: true, warehouse: true }
                },
                category: true,
                unit: true
            }
        }),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        (prisma as any).productCategory.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const productsData = sanitizeData(rawProducts);
    const shops = sanitizeData(rawShops);
    const warehouses = sanitizeData(rawWarehouses);
    const categories = sanitizeData(rawCategories);
    const currency = sanitizeData(baseCurrency) || { symbol: 'ALL', rate: 1 };

    const products = productsData.filter((product: any) => {
        if (filter === 'all') return true;
        if (filter === 'warehouse') return product.inventory.some((inv: any) => inv.warehouseId !== null && inv.quantity > 0);
        if (filter === 'shops') return product.inventory.some((inv: any) => inv.shopId !== null && inv.quantity > 0);
        if (filter === 'specific_shop' && shopId) return product.inventory.some((inv: any) => inv.shopId === shopId && inv.quantity > 0);
        if (filter === 'specific_warehouse' && warehouseId) return product.inventory.some((inv: any) => inv.warehouseId === warehouseId && inv.quantity > 0);
        return true;
    });

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Asset Inventory</h1>
                        <p className="text-sm text-slate-400 font-medium">Manage products, stock levels, and locations</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <BulkUploadDialog selectedBusinessId={selectedBusinessId} />
                    <Link href="/admin/inventory/bulk" className="h-10 px-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                        <List size={16} className="text-blue-600" /> Batch Add
                    </Link>
                    <Link href="/admin/inventory/new" className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors">
                        <Plus size={16} /> Add Asset
                    </Link>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="w-full lg:w-auto">
                    <InventoryFilter
                        currentFilter={filter}
                        currentShopId={shopId}
                        currentWarehouseId={warehouseId}
                        shops={shops}
                        warehouses={warehouses}
                    />
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search assets by name or SKU..."
                        className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <InventoryClient
                    products={products}
                    filter={filter}
                    shopId={shopId}
                    warehouseId={warehouseId}
                    currency={currency}
                    categories={categories}
                    activeCategoryId={categoryId}
                />
            </div>
        </div>
    );
}
