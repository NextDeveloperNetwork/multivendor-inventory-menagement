'use client';

import { useState, useEffect } from 'react';
import { createWarehouse } from '@/app/actions/warehouse';
import { Warehouse as WarehouseIcon, Plus, MapPin, Globe, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import MapPicker from './MapPicker';

export default function WarehouseForm({ selectedBusinessId }: { selectedBusinessId: string | null }) {
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
        if (selectedBusinessId) {
            formData.append('businessId', selectedBusinessId);
        }

        const result = await createWarehouse(formData);

        if (result.success) {
            toast.success('Warehouse location registered: ' + name);
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
        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Form Header area */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] italic flex items-center gap-3 relative z-10">
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <WarehouseIcon size={12} className="text-white" />
                    </div>
                    Warehouse Designation
                </h3>
            </div>

            <div className="p-6 space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 italic">Warehouse Identifier</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Central Repository..."
                            className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black placeholder:text-slate-300 focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 uppercase italic"
                            required
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                            <Info size={14} />
                        </div>
                    </div>
                </div>

                {/* Coordinates Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1 border-b border-slate-100 pb-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Geospatial Registry</label>
                        <Globe size={12} className="text-slate-300" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative group">
                            <input
                                type="text"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="LATITUDE"
                                className="w-full px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic"
                            />
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="LONGITUDE"
                                className="w-full px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic"
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
            <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-slate-900 text-white rounded-xl font-black shadow-lg shadow-black/10 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] disabled:opacity-50 italic"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        <>
                            <Plus size={16} /> Save Warehouse Location
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
