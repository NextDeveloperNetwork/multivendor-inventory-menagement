import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';
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
        include: {
            inventory: true,
        }
    });

    const businesses = await prisma.business.findMany({
        orderBy: { name: 'asc' }
    });

    const serializedWarehouses = JSON.parse(JSON.stringify(warehouses));
    const serializedBusinesses = JSON.parse(JSON.stringify(businesses));

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Warehouse <span className="text-blue-600">Assets</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Storage Infrastructure & Inventory Distribution Registry
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Creation Form */}
                <div className="lg:col-span-4 self-start">
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm sticky top-6">
                        <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Register Location</h2>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5 italic">Add New Storage Infrastructure Unit</p>
                            </div>
                        </div>
                        <WarehouseForm selectedBusinessId={selectedBusinessId} />
                    </div>
                </div>

                {/* Warehouse List */}
                <div className="lg:col-span-8">
                    <WarehousesClient 
                        initialWarehouses={serializedWarehouses} 
                        businesses={serializedBusinesses}
                    />
                </div>
            </div>
        </div>
    );
}
