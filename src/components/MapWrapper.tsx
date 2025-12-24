'use client';

import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-slate-50 rounded-[3.5rem] flex flex-col items-center justify-center space-y-8 animate-pulse border-2 border-slate-100">
            <div className="relative">
                <Globe size={80} className="text-slate-200 rotate-12" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                </div>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Synchronizing Atlas</span>
                </div>
                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">establishing global link...</div>
            </div>
        </div>
    )
});

export default function MapWrapper({
    locations,
    onLocationSelect,
    selectedLocation
}: {
    locations: any[],
    onLocationSelect?: (lat: number, lng: number) => void,
    selectedLocation?: { latitude: number; longitude: number } | null
}) {
    return (
        <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-50">
            <MapComponent
                locations={locations}
                onLocationSelect={onLocationSelect}
                selectedLocation={selectedLocation}
            />
        </div>
    );
}
