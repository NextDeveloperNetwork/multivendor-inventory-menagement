'use client';

import { useState } from 'react';
import { MapPin, X, Check } from 'lucide-react';
import MapWrapper from './MapWrapper';

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
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 px-6 h-16 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-blue-500 transition-all group"
            >
                <MapPin className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-xs uppercase tracking-widest">Select Location</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-5xl h-[80vh] bg-white border border-slate-200 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Location <span className="text-blue-600">Picker</span></h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select the official position for this entity</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {selected && (
                                    <div className="px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center">
                                        <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest">Coordinates Locked</span>
                                        <span className="text-[10px] text-slate-600 font-mono font-bold">{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => confirmSelection()}
                                    disabled={!selected}
                                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-100"
                                >
                                    <Check size={16} /> Confirm Selection
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                                >
                                    <X size={20} />
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
                            <div className="absolute bottom-6 left-6 z-[500] pointer-events-none">
                                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-4 rounded-2xl space-y-2 shadow-lg ring-1 ring-black/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Selection Active</span>
                                    </div>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Click anywhere on the map to set the primary address node</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
