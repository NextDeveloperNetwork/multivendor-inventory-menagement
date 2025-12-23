import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Warehouse, Plus, MapPin, Calendar, Package, ArrowRight } from 'lucide-react';
import WarehouseForm from '../../../../components/WarehouseForm';

export default async function WarehousesPage() {
    const warehouses = await prisma.warehouse.findMany({
        orderBy: { name: 'asc' },
        include: {
            inventory: true,
        }
    });

    return (
        <div className="space-y-12 fade-in relative pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Depot <span className="text-blue-600">Infrastructure</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            <Warehouse size={20} className="text-blue-500" />
                            Manage Global Distribution Centers & Logistics Hubs
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Creation Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-12">
                        <div className="mb-8 px-4">
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter italic flex items-center gap-4">
                                <Plus size={24} className="text-blue-500" />
                                Initialize Node
                            </h2>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-2">Append new distribution hub terminal</p>
                        </div>
                        <WarehouseForm />
                    </div>
                </div>

                {/* Warehouse List */}
                <div className="lg:col-span-2 space-y-8">
                    {warehouses.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-blue-100 rounded-[3rem] p-32 text-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-100 mx-auto mb-8">
                                <Warehouse size={48} />
                            </div>
                            <p className="text-2xl font-black text-black uppercase tracking-tighter italic">Registry Empty</p>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-3">No active warehouse nodes detected in system telemetry.</p>
                        </div>
                    ) : (
                        warehouses.map(wh => {
                            const totalStock = wh.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                            const productCount = wh.inventory.filter(inv => inv.quantity > 0).length;

                            return (
                                <div key={wh.id} className="bg-white border-2 border-blue-50 p-10 rounded-[3rem] shadow-2xl shadow-blue-500/5 hover:bg-blue-50/30 transition-all group relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-40 h-40 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex gap-6">
                                            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-sm">
                                                <Warehouse size={36} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-black uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors uppercase underline decoration-blue-500/10 decoration-4 underline-offset-8 decoration-transparent group-hover:decoration-blue-500/20">{wh.name}</h3>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-blue-50 shadow-sm">
                                                        <Package size={14} className="text-blue-400" />
                                                        <span className="text-[10px] font-black text-black uppercase tracking-widest">{productCount} ASSETS</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-blue-50 shadow-sm">
                                                        <Calendar size={14} className="text-blue-400" />
                                                        <span className="text-[10px] font-black text-black uppercase tracking-widest font-mono">EST {new Date(wh.createdAt).getFullYear()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-5xl font-black text-black font-mono tracking-tighter italic">${totalStock.toLocaleString()}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-300 mt-2">UNITS IN RESERVE</div>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex gap-4 relative z-10">
                                        <Link href={`/admin/inventory?filter=specific_warehouse&warehouseId=${wh.id}`} className="h-14 px-8 bg-black text-white rounded-2xl font-bold shadow-xl shadow-blue-500/10 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center gap-3 uppercase tracking-widest text-xs border-2 border-black">
                                            Telemetry <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
