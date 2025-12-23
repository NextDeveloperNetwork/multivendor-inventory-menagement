import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Prisma } from '@prisma/client';
import InventoryFilter from '@/components/InventoryFilter';
import { sanitizeData } from '@/lib/utils';
import InventoryClient from '@/components/InventoryClient';

interface InventoryPageProps {
    searchParams: Promise<{
        filter?: string;
        shopId?: string;
        warehouseId?: string;
        q?: string;
    }>
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
    const params = await searchParams;
    const { filter = 'all', shopId, warehouseId, q = '' } = params;

    // Fetch all needed data
    const [rawProducts, rawShops, rawWarehouses] = await Promise.all([
        prisma.product.findMany({
            where: q ? {
                OR: [
                    { name: { contains: q } },
                    { sku: { contains: q } }
                ]
            } : {},
            orderBy: { name: 'asc' },
            include: {
                inventory: true
            }
        }),
        prisma.shop.findMany({ orderBy: { name: 'asc' } }),
        prisma.warehouse.findMany({ orderBy: { name: 'asc' } })
    ]);

    const productsData = sanitizeData(rawProducts);
    const shops = sanitizeData(rawShops);
    const warehouses = sanitizeData(rawWarehouses);

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
        <div className="space-y-12 fade-in relative pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Inventory <span className="text-blue-600">Matrix</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            <Plus size={20} className="text-blue-500" />
                            Full Catalog Visibility & Asset Control
                        </p>
                    </div>
                    <Link href="/admin/inventory/new" className="h-16 px-10 bg-black text-white rounded-2xl font-bold shadow-2xl shadow-blue-500/10 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center gap-4 uppercase tracking-[0.2em] text-xs border-2 border-black">
                        <Plus size={24} /> Add New Catalog Item
                    </Link>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5">
                <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
                    <div className="flex-1 w-full">
                        <InventoryFilter
                            currentFilter={filter}
                            currentShopId={shopId}
                            currentWarehouseId={warehouseId}
                            shops={shops}
                            warehouses={warehouses}
                        />
                    </div>

                    <div className="relative w-full xl:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600" size={24} />
                        <input
                            type="text"
                            placeholder="Locate System Assets..."
                            className="w-full pl-16 pr-6 h-16 bg-blue-50/50 border-2 border-blue-100 rounded-2xl text-sm font-bold placeholder:text-gray-500 focus:border-blue-400 focus:bg-white transition-all outline-none text-black"
                            defaultValue={q}
                        />
                    </div>
                </div>
            </div>

            {/* Client Interface */}
            <InventoryClient
                products={products}
                filter={filter}
                shopId={shopId}
                warehouseId={warehouseId}
            />
        </div>
    );
}
