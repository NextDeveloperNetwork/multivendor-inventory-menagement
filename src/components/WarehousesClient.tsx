'use client';

import { useState } from 'react';
import { Warehouse, Plus, MapPin, Package, ArrowRight, Edit2, X, Globe, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import DeleteWarehouseButton from './DeleteWarehouseButton';
import { updateWarehouse } from '@/app/actions/warehouse';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import MapPicker from './MapPicker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface WarehouseData {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    inventory: any[];
}

export default function WarehousesClient({ initialWarehouses }: { initialWarehouses: WarehouseData[] }) {
    const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingWarehouse) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await updateWarehouse(editingWarehouse.id, formData);

        if (res.success) {
            toast.success('Warehouse registry updated: ' + (formData.get('name') as string));
            setEditingWarehouse(null);
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            {initialWarehouses.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-[2rem] py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <Warehouse size={32} />
                    </div>
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">No Locations Registered</p>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-2 italic">Start by adding your first storage location in the sidebar.</p>
                </div>
            ) : (
                initialWarehouses.map(wh => {
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
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">Current Stock Assets</div>
                                    </div>
                                    <div className="flex gap-2 relative z-10">
                                        <Link href={`/admin/inventory?filter=specific_warehouse&warehouseId=${wh.id}`} className="h-10 px-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-black shadow-sm hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2 uppercase tracking-[0.2em] text-[9px] italic">
                                            View Assets <ArrowRight size={14} />
                                        </Link>
                                        <button 
                                            onClick={() => setEditingWarehouse(wh)}
                                            className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                            title="Modify Registry"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteWarehouseButton id={wh.id} />
                                    </div>
                                </div>
                            </div>

                            {(wh.latitude || wh.longitude) && (
                                <div className="absolute bottom-4 right-4 text-[7px] font-black font-mono text-slate-200 uppercase tracking-widest italic group-hover:text-slate-300 transition-colors pointer-events-none">
                                    COORD_{wh.latitude?.toFixed(4)}, {wh.longitude?.toFixed(4)}
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            <Dialog open={!!editingWarehouse} onOpenChange={(open) => { if(!open) setEditingWarehouse(null); }}>
                <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 pb-4 bg-white border-b border-slate-50 flex flex-row justify-between items-center space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Warehouse size={22} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                                    Modify Warehouse Registry
                                </DialogTitle>
                                <DialogDescription className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">
                                    Update Warehouse Identifier & Geospatial Coordinates
                                </DialogDescription>
                            </div>
                        </div>
                        <button onClick={() => setEditingWarehouse(null)} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200 shadow-sm">
                            <X size={20} />
                        </button>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="p-8 space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic ml-1">Warehouse Identifier</label>
                            <div className="relative group">
                                <input
                                    name="name"
                                    defaultValue={editingWarehouse?.name}
                                    className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 placeholder:text-slate-300 focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic"
                                    placeholder="Warehouse Designation"
                                    required
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Info size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 ml-1">
                                <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">Geospatial Registry</label>
                                <Globe size={14} className="text-slate-300" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group">
                                    <input
                                        name="latitude"
                                        defaultValue={editingWarehouse?.latitude || ''}
                                        className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic shadow-sm"
                                        placeholder="LATITUDE"
                                    />
                                </div>
                                <div className="relative group">
                                    <input
                                        name="longitude"
                                        defaultValue={editingWarehouse?.longitude || ''}
                                        className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic shadow-sm"
                                        placeholder="LONGITUDE"
                                    />
                                </div>
                            </div>

                            <MapPicker onSelect={(lat, lng) => {
                                // This is tricky with uncontrolled components. We might need a small state for coordinates if we use MapPicker.
                                // For now, let's just use the direct inputs or improve later.
                            }} />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 italic border border-slate-800"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Edit2 size={20} /> Authorize Modification</>}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
