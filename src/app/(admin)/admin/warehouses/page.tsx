import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Warehouse, Plus, MapPin, Calendar, Package, ArrowRight } from 'lucide-react';
import WarehouseForm from '../../../../components/WarehouseForm';
import DeleteWarehouseButton from '../../../../components/DeleteWarehouseButton';

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

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Warehouse <span className="text-blue-600">Assets</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Location Registry & Inventory Distribution Management
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
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Add New Storage Warehouse</p>
                            </div>
                        </div>
                        <WarehouseForm selectedBusinessId={selectedBusinessId} />
                    </div>
                </div>

                {/* Warehouse List */}
                <div className="lg:col-span-8 space-y-4">
                    {warehouses.length === 0 ? (
                        <div className="bg-white border border-slate-200 border-dashed rounded-[2rem] py-24 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                                <Warehouse size={32} />
                            </div>
                            <p className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">No Locations Registered</p>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-2 italic">Start by adding your first storage location in the sidebar.</p>
                        </div>
                    ) : (
                        (warehouses as any[]).map(wh => {
                            const totalStock = wh.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                            const productCount = wh.inventory.filter((inv: any) => inv.quantity > 0).length;

                            return (
                                <div key={wh.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-blue-600/50 transition-all group relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <Warehouse size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors leading-tight">{wh.name}</h3>
                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-mono italic">
                                                        <Package size={10} className="text-blue-600" />
                                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">{productCount} Unique Items</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-mono italic">
                                                        <MapPin size={10} className="text-blue-600" />
                                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">Registered {new Date(wh.createdAt).getFullYear()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter italic leading-none">{totalStock.toLocaleString()}</div>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">Total Stock Units</div>
                                            </div>
                                            <div className="flex gap-2 relative z-10">
                                                <Link href={`/admin/inventory?filter=specific_warehouse&warehouseId=${wh.id}`} className="h-10 px-4 bg-slate-900 text-white rounded-xl font-black shadow-lg shadow-black/10 hover:bg-blue-600 transition-all flex items-center gap-2 uppercase tracking-[0.2em] text-[9px] italic">
                                                    View Stock <ArrowRight size={14} />
                                                </Link>
                                                <DeleteWarehouseButton id={wh.id} />
                                            </div>
                                        </div>
                                    </div>

                                    {(wh.latitude || wh.longitude) && (
                                        <div className="absolute bottom-4 right-4 text-[7px] font-black font-mono text-slate-200 uppercase tracking-widest italic group-hover:text-slate-300 transition-colors pointer-events-none">
                                            LOC_{wh.latitude?.toFixed(4)}, {wh.longitude?.toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
