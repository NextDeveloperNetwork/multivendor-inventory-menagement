import { prisma } from '@/lib/prisma';
import { Target, Zap, Activity, Map as MapIcon } from 'lucide-react';
import MapPageClient from '@/components/MapPageClient';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
    const [shops, warehouses, suppliers] = await Promise.all([
        prisma.shop.findMany({
            select: { id: true, name: true, latitude: true, longitude: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.warehouse.findMany({
            select: { id: true, name: true, latitude: true, longitude: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.supplier.findMany({
            select: { id: true, name: true, latitude: true, longitude: true },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const locations = [
        ...shops.map(s => ({ ...s, type: 'shop' as const })),
        ...warehouses.map(w => ({ ...w, type: 'warehouse' as const })),
        ...suppliers.map(sup => ({ ...sup, type: 'supplier' as const }))
    ];

    return (
        <div className="space-y-6 md:space-y-12 animate-in fade-in duration-1000 h-[calc(100vh-120px)] flex flex-col pb-4 md:pb-10">
            {/* Professional Header */}
            <div className="relative overflow-hidden bg-white rounded-[2rem] md:rounded-[40px] p-6 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] shrink-0 border border-slate-100 group/header">
                <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-blue-500/5 rounded-full -mr-48 md:-mr-96 -mt-48 md:-mt-96 blur-[60px] md:blur-[120px]"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-10">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-3 md:p-4 bg-blue-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-100 group-hover/header:rotate-6 transition-transform duration-500">
                                <MapIcon className="text-white w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Operations Control</span>
                                <span className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 md:mt-1">Spatial Inventory Distribution</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                Global <span className="text-blue-600">Map</span>
                            </h1>
                            <p className="mt-3 md:mt-6 text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] flex flex-wrap items-center gap-3 md:gap-6">
                                <span className="flex items-center gap-2 md:gap-3 text-slate-600"><div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-100"></div> {locations.length} Nodes</span>
                                <span className="hidden md:block w-px h-4 bg-slate-200"></span>
                                <span className="text-blue-500">Global Network</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto">
                        <div className="flex-1 md:flex-none px-6 md:px-10 py-4 md:py-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center group/stat hover:border-blue-200 transition-all">
                            <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1 md:mb-2">Sync Time</span>
                            <span className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 md:flex-none px-6 md:px-10 py-4 md:py-6 bg-blue-600 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center group/stat shadow-xl shadow-blue-100">
                            <span className="text-white/60 text-[8px] font-black uppercase tracking-widest mb-1 md:mb-2">Network Status</span>
                            <span className="text-lg md:text-2xl font-black text-white tracking-tight">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            <MapPageClient
                initialLocations={locations as any}
                shopsCount={shops.length}
                warehousesCount={warehouses.length}
                suppliersCount={suppliers.length}
                recentShops={shops.slice(0, 5)}
                recentWarehouses={warehouses.slice(0, 5)}
                recentSuppliers={suppliers.slice(0, 5)}
            />
        </div>
    );
}
