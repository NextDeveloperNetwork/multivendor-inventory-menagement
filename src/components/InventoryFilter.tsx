'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Filter, Store, Warehouse } from 'lucide-react';

interface InventoryFilterProps {
    currentFilter: string;
    currentShopId?: string;
    currentWarehouseId?: string;
    shops: any[];
    warehouses: any[];
}

export default function InventoryFilter({
    currentFilter,
    currentShopId,
    currentWarehouseId,
    shops,
    warehouses
}: InventoryFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateFilter = (filter: string, id?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('filter', filter);

        if (filter === 'specific_shop' && id) {
            params.set('shopId', id);
            params.delete('warehouseId');
        } else if (filter === 'specific_warehouse' && id) {
            params.set('warehouseId', id);
            params.delete('shopId');
        } else {
            params.delete('shopId');
            params.delete('warehouseId');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap gap-4 p-2 bg-blue-50/50 rounded-2xl border border-blue-50 inline-flex shadow-inner">
            <button
                onClick={() => updateFilter('all')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentFilter === 'all' ? 'bg-black text-white shadow-xl translate-y-[-1px]' : 'bg-white text-blue-400 border border-blue-100 hover:border-blue-400'}`}
            >
                <Filter size={14} /> Global
            </button>
            <button
                onClick={() => updateFilter('warehouse')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentFilter === 'warehouse' ? 'bg-black text-white shadow-xl translate-y-[-1px]' : 'bg-white text-blue-400 border border-blue-100 hover:border-blue-400'}`}
            >
                <Warehouse size={14} /> Warehouses
            </button>
            <button
                onClick={() => updateFilter('shops')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentFilter === 'shops' ? 'bg-black text-white shadow-xl translate-y-[-1px]' : 'bg-white text-blue-400 border border-blue-100 hover:border-blue-400'}`}
            >
                <Store size={14} /> Shops
            </button>

            <div className="h-4 w-px bg-blue-100 mx-2 self-center hidden md:block" />

            {/* Shop Dropdown */}
            <select
                className="bg-white border-2 border-blue-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-black outline-none focus:border-blue-400 transition-all shadow-sm appearance-none min-w-[180px]"
                value={currentFilter === 'specific_shop' ? currentShopId : ''}
                onChange={(e) => updateFilter('specific_shop', e.target.value)}
            >
                <option value="" disabled className="text-blue-100">Select Shop Node</option>
                {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
            </select>

            {/* Warehouse Dropdown */}
            <select
                className="bg-white border-2 border-blue-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-black outline-none focus:border-blue-400 transition-all shadow-sm appearance-none min-w-[200px]"
                value={currentFilter === 'specific_warehouse' ? currentWarehouseId : ''}
                onChange={(e) => updateFilter('specific_warehouse', e.target.value)}
            >
                <option value="" disabled className="text-blue-100">Select Warehouse Node</option>
                {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
            </select>
        </div>
    );
}
