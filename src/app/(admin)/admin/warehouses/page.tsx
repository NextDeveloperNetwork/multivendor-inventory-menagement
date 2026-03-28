import { prisma } from '@/lib/prisma';
import { Plus, Warehouse } from 'lucide-react';
import WarehouseForm from '../../../../components/WarehouseForm';
import WarehousesClient from '../../../../components/WarehousesClient';
import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function WarehousesPage() {
    const filter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();

    const warehouses = await prisma.warehouse.findMany({
        where: filter as any,
        orderBy: { name: 'asc' },
        include: { inventory: true }
    });

    const businesses = await prisma.business.findMany({
        orderBy: { name: 'asc' }
    });

    const serializedWarehouses = JSON.parse(JSON.stringify(warehouses));
    const serializedBusinesses = JSON.parse(JSON.stringify(businesses));

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Warehouse size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Warehouse Assets</h1>
                        <p className="text-sm text-slate-400 font-medium">Storage infrastructure & distribution registry</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Creation Form */}
                <div className="lg:col-span-4 self-start">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">Register Location</h2>
                        </div>
                        <WarehouseForm selectedBusinessId={selectedBusinessId} />
                    </div>
                </div>

                {/* Warehouse List */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
                    <WarehousesClient 
                        initialWarehouses={serializedWarehouses} 
                        businesses={serializedBusinesses}
                    />
                </div>
            </div>
        </div>
    );
}
