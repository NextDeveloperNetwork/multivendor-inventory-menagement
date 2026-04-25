'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Globe, Warehouse, Store, TrendingDown, PackageCheck } from 'lucide-react';

interface InventoryFilterProps {
    currentFilter: string;
    currentShopId?: string;
    currentWarehouseId?: string;
    shops: any[];
    warehouses: any[];
}

const FILTERS = [
    {
        key: 'all',
        label: 'All',
        icon: Globe,
        active: 'bg-slate-900 text-white shadow-md',
        idle: 'text-slate-500 hover:text-slate-900 hover:bg-slate-200',
    },
    {
        key: 'warehouse',
        label: 'Warehouses',
        icon: Warehouse,
        active: 'bg-violet-600 text-white shadow-md shadow-violet-200',
        idle: 'text-violet-500 hover:text-violet-700 hover:bg-violet-50',
    },
    {
        key: 'shops',
        label: 'Shops',
        icon: Store,
        active: 'bg-blue-600 text-white shadow-md shadow-blue-200',
        idle: 'text-blue-500 hover:text-blue-700 hover:bg-blue-50',
    },
    {
        key: 'in_stock',
        label: 'In Stock',
        icon: PackageCheck,
        active: 'bg-emerald-500 text-white shadow-md shadow-emerald-200',
        idle: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
    },
    {
        key: 'depleted',
        label: 'Depleted',
        icon: TrendingDown,
        active: 'bg-rose-500 text-white shadow-md shadow-rose-200',
        idle: 'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
    },
];

export default function InventoryFilter({
    currentFilter, currentShopId, currentWarehouseId, shops, warehouses
}: InventoryFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateFilter = (filter: string, id?: string) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('filter', filter);
        if (filter === 'specific_shop' && id) { p.set('shopId', id); p.delete('warehouseId'); }
        else if (filter === 'specific_warehouse' && id) { p.set('warehouseId', id); p.delete('shopId'); }
        else { p.delete('shopId'); p.delete('warehouseId'); }
        router.push(`${pathname}?${p.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Pill segment */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-0.5 shadow-inner">
                {FILTERS.map(({ key, label, icon: Icon, active, idle }) => (
                    <button
                        key={key}
                        onClick={() => updateFilter(key)}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap
                            ${currentFilter === key ? active : idle}`}
                    >
                        <Icon size={12} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Shop select */}
            {shops.length > 0 && (
                <div className="relative">
                    <Store size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                    <select
                        value={currentFilter === 'specific_shop' ? (currentShopId ?? '') : ''}
                        onChange={(e) => updateFilter('specific_shop', e.target.value)}
                        className={`h-9 pl-8 pr-7 border rounded-xl text-[10px] font-semibold outline-none transition-all appearance-none cursor-pointer max-w-[180px]
                            ${currentFilter === 'specific_shop'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}
                    >
                        <option value="" disabled>Shop</option>
                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}

            {/* Warehouse select */}
            {warehouses.length > 0 && (
                <div className="relative">
                    <Warehouse size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none" />
                    <select
                        value={currentFilter === 'specific_warehouse' ? (currentWarehouseId ?? '') : ''}
                        onChange={(e) => updateFilter('specific_warehouse', e.target.value)}
                        className={`h-9 pl-8 pr-7 border rounded-xl text-[10px] font-semibold outline-none transition-all appearance-none cursor-pointer max-w-[200px]
                            ${currentFilter === 'specific_warehouse'
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'}`}
                    >
                        <option value="" disabled>Warehouse</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
}
