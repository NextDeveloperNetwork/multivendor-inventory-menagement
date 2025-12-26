'use client';

import { useState, useMemo } from 'react';
import MapWrapper from './MapWrapper';
import EntityDetails from './EntityDetails';
import {
    Search,
    Store,
    Warehouse,
    Building2,
    MapPin,
    X,
    Navigation,
    Layers,
    ChevronRight,
    SlidersHorizontal,
    List
} from 'lucide-react';

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
    shopsCount,
    warehousesCount,
    suppliersCount,
}: MapPageClientProps) {
    const [selected, setSelected] = useState<{ latitude: number; longitude: number; name?: string; type?: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>(['shop', 'warehouse', 'supplier']);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter and search locations
    const filteredLocations = useMemo(() => {
        return initialLocations.filter(loc => {
            const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilters.includes(loc.type);
            return matchesSearch && matchesFilter;
        });
    }, [initialLocations, searchQuery, activeFilters]);

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Find nearest location to selected
    const nearestLocation = useMemo(() => {
        if (!selected || !selected.latitude || !selected.longitude) return null;

        let nearest: any = null;
        let minDistance = Infinity;

        filteredLocations.forEach(loc => {
            if (loc.latitude && loc.longitude &&
                (loc.latitude !== selected.latitude || loc.longitude !== selected.longitude)) {
                const distance = calculateDistance(
                    selected.latitude,
                    selected.longitude,
                    loc.latitude,
                    loc.longitude
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = { ...loc, distance };
                }
            }
        });

        return nearest;
    }, [selected, filteredLocations]);

    const toggleFilter = (type: string) => {
        setActiveFilters(prev =>
            prev.includes(type)
                ? prev.filter(f => f !== type)
                : [...prev, type]
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'shop': return <Store size={16} />;
            case 'warehouse': return <Warehouse size={16} />;
            case 'supplier': return <Building2 size={16} />;
            default: return <MapPin size={16} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-4 relative">
            {/* Compact Top Bar */}
            <div className="flex flex-col sm:flex-row gap-3 relative z-[1000]">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-10 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-400 outline-none transition-all text-sm shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-12 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${showFilters
                            ? 'bg-blue-600 text-white border-2 border-blue-600'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
                            }`}
                    >
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`h-12 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${showSidebar
                            ? 'bg-blue-600 text-white border-2 border-blue-600'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
                            }`}
                    >
                        <List size={16} />
                        <span className="hidden sm:inline">List</span>
                    </button>
                </div>
            </div>

            {/* Filter Chips - Collapsible */}
            {showFilters && (
                <div className="flex flex-wrap gap-2 relative z-[1000] animate-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={() => toggleFilter('shop')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${activeFilters.includes('shop')
                            ? 'bg-blue-600 text-white border-2 border-blue-600'
                            : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-blue-300'
                            }`}
                    >
                        <Store size={14} />
                        Shops ({shopsCount})
                    </button>
                    <button
                        onClick={() => toggleFilter('warehouse')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${activeFilters.includes('warehouse')
                            ? 'bg-emerald-600 text-white border-2 border-emerald-600'
                            : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-emerald-300'
                            }`}
                    >
                        <Warehouse size={14} />
                        Warehouses ({warehousesCount})
                    </button>
                    <button
                        onClick={() => toggleFilter('supplier')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${activeFilters.includes('supplier')
                            ? 'bg-purple-600 text-white border-2 border-purple-600'
                            : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-purple-300'
                            }`}
                    >
                        <Building2 size={14} />
                        Suppliers ({suppliersCount})
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex gap-4 relative min-h-[500px]">
                {/* Map Container */}
                <div className="flex-1 relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xl bg-white">
                    <MapWrapper
                        locations={filteredLocations}
                        onLocationSelect={(lat, lng) => {
                            const location = filteredLocations.find(l => l.latitude === lat && l.longitude === lng);
                            setSelected(location ? { latitude: lat, longitude: lng, name: location.name, type: location.type } : { latitude: lat, longitude: lng });
                        }}
                        selectedLocation={selected}
                    />

                    {/* Bottom Stats Bar */}
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
                        <div className="px-3 py-2 bg-white/95 backdrop-blur-lg rounded-lg border border-slate-200 shadow-lg">
                            <div className="flex items-center gap-2">
                                <Layers size={12} className="text-blue-600" />
                                <span className="text-xs font-bold text-slate-900">{filteredLocations.length}</span>
                            </div>
                        </div>
                        {selected && nearestLocation && (
                            <div className="px-3 py-2 bg-blue-600 backdrop-blur-lg rounded-lg border border-blue-700 shadow-lg">
                                <div className="flex items-center gap-2">
                                    <Navigation size={12} className="text-white" />
                                    <span className="text-xs font-bold text-white">
                                        {nearestLocation.name} ({nearestLocation.distance.toFixed(1)} km)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Slide from right */}
                {showSidebar && (
                    <div className="w-80 bg-white rounded-2xl border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300">
                        <div className="p-5 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <MapPin size={18} className="text-blue-600" />
                                        Locations
                                    </h3>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                        {filteredLocations.length} Results
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="p-1.5 hover:bg-white rounded-lg transition-all"
                                >
                                    <X size={16} className="text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filteredLocations.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Search size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Results</p>
                                </div>
                            ) : (
                                filteredLocations.map((loc) => {
                                    const isSelected = selected?.latitude === loc.latitude && selected?.longitude === loc.longitude;

                                    // Define color classes based on type
                                    let bgClass = 'bg-white hover:bg-slate-50';
                                    let borderClass = 'border-slate-100';
                                    let iconBgClass = 'bg-slate-100';
                                    let iconTextClass = 'text-slate-600';

                                    if (isSelected) {
                                        if (loc.type === 'shop') {
                                            bgClass = 'bg-blue-50';
                                            borderClass = 'border-blue-300';
                                            iconBgClass = 'bg-blue-600';
                                            iconTextClass = 'text-white';
                                        } else if (loc.type === 'warehouse') {
                                            bgClass = 'bg-emerald-50';
                                            borderClass = 'border-emerald-300';
                                            iconBgClass = 'bg-emerald-600';
                                            iconTextClass = 'text-white';
                                        } else if (loc.type === 'supplier') {
                                            bgClass = 'bg-purple-50';
                                            borderClass = 'border-purple-300';
                                            iconBgClass = 'bg-purple-600';
                                            iconTextClass = 'text-white';
                                        }
                                    } else {
                                        if (loc.type === 'shop') {
                                            iconBgClass = 'bg-blue-100';
                                            iconTextClass = 'text-blue-600';
                                        } else if (loc.type === 'warehouse') {
                                            iconBgClass = 'bg-emerald-100';
                                            iconTextClass = 'text-emerald-600';
                                        } else if (loc.type === 'supplier') {
                                            iconBgClass = 'bg-purple-100';
                                            iconTextClass = 'text-purple-600';
                                        }
                                    }

                                    return (
                                        <button
                                            key={loc.id}
                                            onClick={() => setSelected({ latitude: loc.latitude, longitude: loc.longitude, name: loc.name, type: loc.type })}
                                            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${bgClass} ${borderClass} ${isSelected ? 'shadow-md' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass} ${iconTextClass}`}>
                                                    {getTypeIcon(loc.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-slate-900 truncate">{loc.name}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                                        {loc.type}
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className={`text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Entity Details Panel - Below Map */}
            {selected && selected.name && selected.type && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <EntityDetails
                        entityId={filteredLocations.find(l => l.latitude === selected.latitude && l.longitude === selected.longitude)?.id || ''}
                        entityType={selected.type as 'shop' | 'warehouse' | 'supplier'}
                        entityName={selected.name}
                    />
                </div>
            )}
        </div>
    );
}
