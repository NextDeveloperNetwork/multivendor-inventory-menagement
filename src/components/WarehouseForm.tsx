'use client';

import { useState, useEffect } from 'react';
import { createWarehouse } from '@/app/actions/warehouse';
import { Warehouse as WarehouseIcon, Plus, MapPin, Globe, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import MapPicker from './MapPicker';

export default function WarehouseForm() {
    const searchParams = useSearchParams();
    const initialLat = searchParams.get('lat') || '';
    const initialLng = searchParams.get('lng') || '';

    const [name, setName] = useState('');
    const [latitude, setLatitude] = useState(initialLat);
    const [longitude, setLongitude] = useState(initialLng);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (initialLat) setLatitude(initialLat);
        if (initialLng) setLongitude(initialLng);
    }, [initialLat, initialLng]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);

        const result = await createWarehouse(formData);

        if (result.success) {
            toast.success('System Node Established: ' + name);
            setName('');
            setLatitude('');
            setLongitude('');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-blue-500/5 overflow-hidden flex flex-col">
            {/* Form Header area */}
            <div className="p-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-b border-slate-50 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-100/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] italic flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <WarehouseIcon size={16} className="text-white" />
                    </div>
                    Registry Parameters
                </h3>
            </div>

            <div className="p-8 space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identifier</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Distribution Hub Alpha..."
                            className="w-full pl-12 pr-6 h-14 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xs font-bold placeholder:text-slate-300 focus:border-blue-400 focus:bg-white transition-all outline-none text-slate-900"
                            required
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                            <Info size={18} />
                        </div>
                    </div>
                </div>

                {/* Coordinates Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spatial Data</label>
                        <Globe size={14} className="text-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="LAT"
                                className="w-full px-5 h-12 bg-slate-50 border-2 border-slate-50 rounded-xl text-[10px] font-mono font-bold text-slate-600 focus:border-blue-400 focus:bg-white transition-all outline-none"
                            />
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="LNG"
                                className="w-full px-5 h-12 bg-slate-50 border-2 border-slate-50 rounded-xl text-[10px] font-mono font-bold text-slate-600 focus:border-blue-400 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <MapPicker onSelect={(lat, lng) => {
                        setLatitude(lat.toString());
                        setLongitude(lng.toString());
                    }} />
                </div>
            </div>

            {/* Action Footer */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <>
                            <Plus size={18} /> Deploy Node
                        </>
                    )}
                </button>
                <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Authorized Terminal Creation Only
                </p>
            </div>
        </form>
    );
}
