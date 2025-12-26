'use client';

import { useState } from 'react';
import { MapPin, X, Check, Search, Crosshair } from 'lucide-react';
import MapWrapper from './MapWrapper';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface MapPickerProps {
    onSelect: (lat: number, lng: number) => void;
    initialLocation?: { latitude: number; longitude: number } | null;
}

export default function MapPicker({ onSelect, initialLocation }: MapPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<{ latitude: number; longitude: number } | null>(initialLocation || null);

    const handleSelect = (lat: number, lng: number) => {
        setSelected({ latitude: lat, longitude: lng });
    };

    const confirmSelection = () => {
        if (selected) {
            onSelect(selected.latitude, selected.longitude);
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-6 h-14 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition-all group shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <MapPin className="text-blue-500 group-hover:scale-110 transition-transform" size={18} />
                        <span className="text-[10px] uppercase tracking-widest">
                            {selected
                                ? `${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)}`
                                : "Pinpoint Location"}
                        </span>
                    </div>
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-tighter bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Map
                    </div>
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl z-[9999]">
                <div className="flex flex-col h-full bg-white">
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md relative z-10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Crosshair className="text-white" size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                                    Node <span className="text-blue-600">Positioning</span>
                                </DialogTitle>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Establishing global coordinate reference</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {selected && (
                                <div className="hidden sm:flex px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex-col items-center">
                                    <span className="text-[8px] text-blue-500 font-black uppercase tracking-[0.3em]">Coordinates Locked</span>
                                    <span className="text-xs text-slate-900 font-mono font-bold tracking-tight">
                                        {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={confirmSelection}
                                disabled={!selected}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale shadow-xl shadow-blue-500/20"
                            >
                                <Check size={18} /> Confirm Location
                            </button>
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative">
                        <MapWrapper
                            locations={[]}
                            onLocationSelect={handleSelect}
                            selectedLocation={selected}
                        />

                        {/* HUD Overlay */}
                        <div className="absolute bottom-8 left-8 z-[500] pointer-events-none transition-all">
                            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] space-y-3 shadow-2xl ring-1 ring-white/10 max-w-xs transition-transform transform translate-y-0 translate-x-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></div>
                                    <span className="text-[10px] font-black text-white px-2 py-0.5 bg-blue-500 rounded flex items-center gap-1 uppercase tracking-widest">
                                        System Ready
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] leading-relaxed italic">
                                    Deploy marker by interacting with the surface layer. Coordinates will update in real-time.
                                </p>
                                {selected && (
                                    <div className="pt-2 flex items-center gap-2 text-[10px] font-mono font-bold text-blue-400">
                                        <Crosshair size={12} />
                                        LAT {selected.latitude.toFixed(4)} • LNG {selected.longitude.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
