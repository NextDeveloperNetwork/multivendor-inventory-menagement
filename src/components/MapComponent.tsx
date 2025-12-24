'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Store, Box, Truck, Target, Navigation, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import Link from 'next/link';

// Fix Leaflet icons
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const createCustomIcon = (icon: React.ReactNode, color: string, isUser: boolean = false) => {
    const markup = renderToStaticMarkup(
        <div style={{
            backgroundColor: isUser ? '#3b82f6' : 'white',
            padding: isUser ? '4px' : '8px',
            borderRadius: isUser ? '50%' : '12px',
            border: isUser ? '3px solid white' : `3px solid ${color}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isUser ? 'white' : color,
            width: isUser ? '20px' : 'auto',
            height: isUser ? '20px' : 'auto',
        }}>
            {icon}
        </div>
    );

    return L.divIcon({
        html: markup,
        className: 'custom-map-icon transition-all duration-300 hover:scale-110',
        iconSize: isUser ? [24, 24] : [42, 42],
        iconAnchor: isUser ? [12, 12] : [21, 21],
    });
};

const shopIcon = createCustomIcon(<Store size={22} />, '#3b82f6'); // Blue
const warehouseIcon = createCustomIcon(<Box size={22} />, '#8b5cf6'); // Violet
const supplierIcon = createCustomIcon(<Truck size={22} />, '#f59e0b'); // Amber
const selectedIcon = createCustomIcon(<Target size={22} />, '#ef4444'); // Red
const userIcon = createCustomIcon(<div className="w-2 h-2 bg-white rounded-full animate-pulse" />, '#3b82f6', true);

interface Location {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    type: 'shop' | 'warehouse' | 'supplier';
}

interface MapProps {
    locations: Location[];
    onLocationSelect?: (lat: number, lng: number) => void;
    selectedLocation?: { latitude: number; longitude: number } | null;
}

function ChangeView({ bounds, userLocation }: { bounds: L.LatLngBoundsExpression | null, userLocation: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (userLocation) {
            map.setView(userLocation, 13);
        }
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [bounds, map, userLocation]);
    return null;
}

function MapEvents({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

export default function MapComponent({ locations, onLocationSelect, selectedLocation }: MapProps) {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const validLocations = locations.filter(l => l.latitude !== null && l.longitude !== null && !isNaN(l.latitude) && !isNaN(l.longitude));

    const bounds = validLocations.length > 0
        ? L.latLngBounds(validLocations.map(l => [l.latitude!, l.longitude!]))
        : null;

    const defaultCenter: L.LatLngExpression = [20, 0];

    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    const shareOnWhatsApp = (name: string, lat: number, lng: number) => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        const text = `Location for ${name}: ${googleMapsUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const getDirections = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-slate-50">
            <MapContainer
                center={bounds ? bounds.getCenter() : (userLocation || defaultCenter)}
                zoom={bounds ? 4 : (userLocation ? 13 : 2)}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapEvents onLocationSelect={onLocationSelect} />

                {userLocation && (
                    <>
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>
                                <div className="p-2 font-bold text-blue-600">You are here</div>
                            </Popup>
                        </Marker>
                        <Circle center={userLocation} radius={200} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} />
                    </>
                )}

                {validLocations.map((loc) => (
                    <Marker
                        key={`${loc.type}-${loc.id}`}
                        position={[loc.latitude!, loc.longitude!]}
                        icon={loc.type === 'shop' ? shopIcon : loc.type === 'warehouse' ? warehouseIcon : supplierIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-3 md:p-4 bg-white rounded-xl min-w-[200px] md:min-w-[240px]">
                                <div className="flex items-center justify-between mb-3 md:mb-4">
                                    <div className={`px-2 py-1 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-wider ${loc.type === 'shop' ? 'bg-blue-100 text-blue-600' :
                                        loc.type === 'warehouse' ? 'bg-purple-100 text-purple-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                        {loc.type}
                                    </div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight mb-3 md:mb-4">
                                    {loc.name}
                                </div>
                                <div className="space-y-2 pt-2 md:pt-3 border-t border-slate-100 flex flex-col">
                                    <button
                                        onClick={() => getDirections(loc.latitude!, loc.longitude!)}
                                        className="w-full py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-100"
                                    >
                                        <Navigation size={12} className="md:w-[14px] md:h-[14px]" />
                                        Get Directions
                                    </button>
                                    <button
                                        onClick={() => shareOnWhatsApp(loc.name, loc.latitude!, loc.longitude!)}
                                        className="w-full py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-100"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="md:w-[14px] md:h-[14px]">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Send on WhatsApp
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {selectedLocation && (
                    <Marker
                        position={[selectedLocation.latitude, selectedLocation.longitude]}
                        icon={selectedIcon}
                    >
                        <Popup>
                            <div className="p-3 md:p-4 bg-white rounded-xl min-w-[180px] md:min-w-[200px] border border-red-100 shadow-xl">
                                <div className="text-[8px] md:text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                                    <Target size={12} className="md:w-[14px] md:h-[14px]" /> New Registration
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <Link
                                        href={`/admin/shops?lat=${selectedLocation.latitude}&lng=${selectedLocation.longitude}`}
                                        className="flex items-center gap-2 md:gap-3 w-full p-2.5 md:p-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition-all text-[9px] md:text-[11px] font-black uppercase tracking-wider"
                                    >
                                        <Store size={14} className="md:w-[16px] md:h-[16px]" /> Register Shop
                                    </Link>
                                    <Link
                                        href={`/admin/warehouses?lat=${selectedLocation.latitude}&lng=${selectedLocation.longitude}`}
                                        className="flex items-center gap-2 md:gap-3 w-full p-2.5 md:p-3 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg transition-all text-[9px] md:text-[11px] font-black uppercase tracking-wider"
                                    >
                                        <Box size={14} className="md:w-[16px] md:h-[16px]" /> Establish Hub
                                    </Link>
                                    <Link
                                        href={`/admin/suppliers?lat=${selectedLocation.latitude}&lng=${selectedLocation.longitude}`}
                                        className="flex items-center gap-2 md:gap-3 w-full p-2.5 md:p-3 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg transition-all text-[9px] md:text-[11px] font-black uppercase tracking-wider"
                                    >
                                        <Truck size={14} className="md:w-[16px] md:h-[16px]" /> Sync Supplier
                                    </Link>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                <ChangeView bounds={bounds} userLocation={userLocation} />
            </MapContainer>

            {/* Vivid HUD Overlay */}
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-[500] pointer-events-none flex flex-col gap-3 md:gap-4 max-w-[calc(100vw-32px)]">
                <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-100 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] space-y-3 md:space-y-4 shadow-xl ring-1 ring-black/5 pointer-events-auto">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-ping"></div>
                        <span className="text-[8px] md:text-[10px] font-black text-slate-800 uppercase tracking-widest whitespace-nowrap">Live Network Monitor</span>
                    </div>
                    <div className="flex flex-wrap gap-4 md:gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-blue-500 rounded-md"></div>
                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Shops</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-purple-500 rounded-md"></div>
                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Hubs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-amber-500 rounded-md"></div>
                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Suppliers</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 pointer-events-auto">
                    <button
                        onClick={() => {
                            if (userLocation) setUserLocation([...userLocation]);
                        }}
                        className="bg-white hover:bg-blue-50 text-blue-600 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg border border-slate-100 transition-all active:scale-90 flex items-center gap-2 md:gap-3"
                    >
                        <MapPin size={16} className="md:w-[20px] md:h-[20px]" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Recenter</span>
                    </button>
                    {userLocation && (
                        <div className="bg-emerald-50 text-emerald-600 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-emerald-100 flex items-center gap-2 md:gap-3">
                            <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">GPS OK</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: white !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
                    border-radius: 1.5rem !important;
                    padding: 0 !important;
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0 !important;
                }
                .custom-popup .leaflet-popup-tip {
                    background: white !important;
                }
            `}</style>
        </div>
    );
}
