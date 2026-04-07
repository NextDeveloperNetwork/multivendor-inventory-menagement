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
    List,
    Map as MapIcon
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
    recentShops,
    recentWarehouses,
    recentSuppliers,
}: MapPageClientProps) {
    const [selected, setSelected] = useState<{ latitude: number; longitude: number; name?: string; type?: string; id?: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>(['shop', 'warehouse', 'supplier']);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter and search locations
    const filteredLocations = useMemo(() => {
        return initialLocations.filter(loc => {
            const name = (loc.name || '').toLowerCase();
            const type = loc.type || '';
            const matchesSearch = name.includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilters.includes(type);
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
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Slim Header / Action Bar - Integrated */}
            <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center shrink-0 z-[3000] shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                         <MapIcon size={16} />
                    </div>
                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none whitespace-nowrap">
                        Asset <span className="text-blue-600">Map</span>
                    </h1>
                </div>

                <div className="h-6 w-[1px] bg-slate-200 mx-6 hidden md:block"></div>

                {/* Search - Integrated into Bar */}
                <div className="flex-1 relative group max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search tactical nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-8 bg-slate-100 border-none rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-lg transition-all"><X size={12} className="text-slate-400" /></button>
                    )}
                </div>

                <div className="flex-1"></div>

                {/* Buttons - Integrated into Bar */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all gap-2 flex items-center ${showFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Filters</span>
                    </button>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all gap-2 flex items-center ${showSidebar ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <List size={14} /> <span className="hidden sm:inline">Assets</span>
                    </button>
                </div>
            </div>

            {/* Expanded Content Area with Flex Flow */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Main Map Container - Full width, no padding */}
                <div className="flex-1 relative overflow-hidden bg-slate-100">
                    <MapWrapper
                        locations={filteredLocations}
                        onLocationSelect={(lat, lng) => {
                            const location = filteredLocations.find(l => 
                                (l.latitude === lat && l.longitude === lng) || 
                                (Math.abs(l.latitude - lat) < 0.0001 && Math.abs(l.longitude - lng) < 0.0001)
                            );
                            if (location) {
                                setSelected({ latitude: lat, longitude: lng, name: location.name, type: location.type, id: location.id });
                                if (window.innerWidth < 1024) setShowSidebar(true);
                            } else {
                                setSelected({ latitude: lat, longitude: lng });
                            }
                        }}
                        selectedLocation={selected}
                        showSidebar={showSidebar}
                    />

                    {/* Quick Filters - Overlayed inside the map area */}
                    {showFilters && (
                        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-[1000] animate-in slide-in-from-top-4 duration-300 pointer-events-none">
                            <button onClick={() => toggleFilter('shop')} className={`pointer-events-auto px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl backdrop-blur-xl ${activeFilters.includes('shop') ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white/80 text-slate-500 border border-white/20'}`}>
                                <Store size={14} /> Shops ({shopsCount})
                            </button>
                            <button onClick={() => toggleFilter('warehouse')} className={`pointer-events-auto px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl backdrop-blur-xl ${activeFilters.includes('warehouse') ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white/80 text-slate-500 border border-white/20'}`}>
                                <Warehouse size={14} /> Hubs ({warehousesCount})
                            </button>
                            <button onClick={() => toggleFilter('supplier')} className={`pointer-events-auto px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl backdrop-blur-xl ${activeFilters.includes('supplier') ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-white/80 text-slate-500 border border-white/20'}`}>
                                <Building2 size={14} /> Suppliers ({suppliersCount})
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Sidebar Panel - TRUE Overlaid Drawer */}
            {showSidebar && (
                <div className="w-[300px] sm:w-[400px] absolute right-0 top-0 bottom-0 bg-white border-l border-slate-200 shadow-[-20px_0_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-right-full duration-500 shrink-0 z-[4000]">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                                <MapPin size={18} className="text-blue-600" />
                                Operational <span className="text-blue-600">Roster</span>
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Total connected network assets</p>
                        </div>
                        <button onClick={() => setShowSidebar(false)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group active:scale-95">
                            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {selected ? (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <button 
                                    onClick={() => setSelected(null)}
                                    className="inline-flex items-center gap-2 font-black text-[10px] text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                >
                                    <ChevronRight size={14} className="rotate-180" /> Back to Roster
                                </button>
                                
                                <div className="p-6 bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-800 text-white group block overflow-hidden relative">
                                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-1000">
                                        {getTypeIcon(selected.type || 'hub')}
                                     </div>
                                     <div className="relative z-10">
                                         <h4 className="text-xl font-black uppercase tracking-tight italic">{selected.name}</h4>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                            {selected.type} Node
                                         </p>
                                     </div>
                                </div>

                                <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
                                    <EntityDetails
                                        entityId={selected.id || ''}
                                        entityType={(selected.type as 'shop' | 'warehouse' | 'supplier') || 'shop'}
                                        entityName={selected.name || 'Selected Entity'}
                                    />
                                </div>
                            </div>
                        ) : (
                            filteredLocations.length === 0 ? (
                                <div className="py-24 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 mb-6 animate-pulse">
                                        <Search size={32} className="text-slate-200" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Zero Assets Located</p>
                                </div>
                            ) : (
                                filteredLocations.map((loc) => (
                                    <button
                                        key={loc.id}
                                        onClick={() => setSelected({ latitude: loc.latitude, longitude: loc.longitude, name: loc.name, type: loc.type, id: loc.id })}
                                        className="w-full p-5 bg-white border border-slate-100 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-900/5 rounded-[1.5rem] transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30`}>
                                                {getTypeIcon(loc.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-sm text-slate-900 truncate uppercase italic tracking-tight">{loc.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{loc.type}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                                        </div>
                                    </button>
                                ))
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
