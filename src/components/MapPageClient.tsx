'use client';

import { useState } from 'react';
import MapWrapper from './MapWrapper';

interface MapPageClientProps {
    initialLocations: any[];
    shopsCount: number;
    warehousesCount: number;
    suppliersCount: number;
    recentShops: any[];
    recentWarehouses: any[];
    recentSuppliers: any[];
}

export default function MapPageClient({
    initialLocations,
}: MapPageClientProps) {
    const [selected, setSelected] = useState<{ latitude: number; longitude: number } | null>(null);

    return (
        <div className="flex-1 relative rounded-3xl md:rounded-[40px] overflow-hidden border border-slate-200 shadow-2xl bg-white min-h-[500px]">
            <MapWrapper
                locations={initialLocations}
                onLocationSelect={(lat, lng) => setSelected({ latitude: lat, longitude: lng })}
                selectedLocation={selected}
            />
        </div>
    );
}
