import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, List, Package, Layers } from 'lucide-react';
import InventoryFilter from '@/components/InventoryFilter';
import { sanitizeData } from '@/lib/utils';
import InventoryClient from '@/components/InventoryClient';
import BulkUploadDialog from '@/components/BulkUploadDialog';
import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';
import { InventoryMetaButtons } from '@/components/InventoryMetaButtons';

export const dynamic = 'force-dynamic';

interface InventoryPageProps {
    searchParams: Promise<{
        filter?: string;
        shopId?: string;
        warehouseId?: string;
        q?: string;
        categoryId?: string;
    }>;
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
                inventory: { include: { shop: true, warehouse: true } },
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
        if (filter === 'depleted') return product.inventory.reduce((s: number, i: any) => s + i.quantity, 0) <= 0;
        if (filter === 'in_stock') return product.inventory.reduce((s: number, i: any) => s + i.quantity, 0) > 0;
        return true;
    });

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto">

            {/* ── Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 shadow-xl shadow-blue-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Decorative circles */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-8 right-24 w-32 h-32 rounded-full bg-white/5" />

                <div className="flex items-center gap-4 relative">
                    <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20">
                        <Package size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Asset Inventory</h1>
                        <p className="text-sm text-blue-100 font-medium mt-0.5">Products · Stock · Locations</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 relative">
                    <InventoryMetaButtons />
                    <BulkUploadDialog selectedBusinessId={selectedBusinessId} />
                    <Link
                        href="/admin/inventory/bulk"
                        className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors backdrop-blur"
                    >
                        <Layers size={15} /> Batch Add
                    </Link>
                    <Link
                        href="/admin/inventory/new"
                        className="h-10 px-5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-colors"
                    >
                        <Plus size={16} /> Add Asset
                    </Link>
                </div>
            </div>

            {/* ── Filter bar (no search — search lives in client toolbar) ── */}
            <InventoryFilter
                currentFilter={filter}
                currentShopId={shopId}
                currentWarehouseId={warehouseId}
                shops={shops}
                warehouses={warehouses}
            />

            {/* ── Main Content ── */}
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
    );
}
