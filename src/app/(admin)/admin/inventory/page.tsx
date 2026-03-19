import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Search, List } from 'lucide-react';
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

    // Fetch all needed data
    const [rawProducts, rawShops, rawWarehouses, rawCategories, baseCurrency] = await Promise.all([
        (prisma.product as any).findMany({
            where: {
                ...businessFilter,
                ...(q ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { sku: { contains: q, mode: 'insensitive' } }
                    ]
                } : {}),
                ...(categoryId ? { categoryId } : {})
            } as any,
            orderBy: { name: 'asc' },
            include: {
                inventory: {
                    include: {
                        shop: true,
                        warehouse: true
                    }
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
    const currency = sanitizeData(baseCurrency) || { symbol: '$', rate: 1 };

    type ProductWithInventory = Prisma.ProductGetPayload<{
        include: { inventory: true }
    }>;

    // Filter products based on location if requested
    const products = productsData.filter((product: any) => {
        if (filter === 'all') return true;
        if (filter === 'warehouse') return product.inventory.some((inv: any) => inv.warehouseId !== null && inv.quantity > 0);
        if (filter === 'shops') return product.inventory.some((inv: any) => inv.shopId !== null && inv.quantity > 0);
        if (filter === 'specific_shop' && shopId) return product.inventory.some((inv: any) => inv.shopId === shopId && inv.quantity > 0);
        if (filter === 'specific_warehouse' && warehouseId) return product.inventory.some((inv: any) => inv.warehouseId === warehouseId && inv.quantity > 0);
        return true;
    });

    return (
        <div className="space-y-4 fade-in relative pb-10 max-w-[1600px] mx-auto p-2 md:p-6 text-slate-900">
            {/* Compact Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic line-through decoration-blue-500/30">
                        ASSET <span className="text-blue-600">INVENTORY</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
                        inventory management system
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <BulkUploadDialog selectedBusinessId={selectedBusinessId} />
                    <Link href="/admin/inventory/bulk" className="h-10 px-4 bg-white text-slate-900 border border-slate-200 rounded-lg font-black uppercase tracking-[0.1em] text-[9px] hover:bg-slate-50 transition-all flex items-center gap-2 italic">
                        <List size={14} className="text-blue-600" /> BATCH ADD
                    </Link>
                    <Link href="/admin/inventory/new" className="h-10 px-5 bg-slate-900 text-white rounded-lg font-black uppercase tracking-[0.2em] text-[9px] hover:bg-blue-600 transition-all flex items-center gap-2 italic shadow-lg shadow-black/10 border border-slate-800">
                        <Plus size={16} strokeWidth={3} /> ADD ASSET
                    </Link>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="flex flex-col xl:flex-row gap-4 p-4 bg-slate-50/50 border-b border-slate-200 items-center justify-between">
                    <div className="flex-1 w-full scale-[0.95] origin-left">
                        <InventoryFilter
                            currentFilter={filter}
                            currentShopId={shopId}
                            currentWarehouseId={warehouseId}
                            shops={shops}
                            warehouses={warehouses}
                        />
                    </div>

                    <div className="relative group w-full xl:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Locate system assets..."
                            className="w-full pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-slate-400 focus:border-blue-600 transition-all outline-none text-slate-900 italic"
                        />
                    </div>
                </div>

                {/* Client Interface */}
                <div className="p-4">
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
        </div>
    );
}
