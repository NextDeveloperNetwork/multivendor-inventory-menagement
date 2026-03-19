'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Box } from 'lucide-react';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            },
            /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                onScan(decodedText);
            },
            (error) => {
                // Ignore scan errors as they happen constantly during search
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/20">
                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                            <Camera size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-tight italic leading-none">Optical Scan</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Acquiring identifier...</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm relative z-10 hover:rotate-90"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scanner Body */}
                <div className="p-2 bg-white relative">
                    <div id="reader" className="w-full overflow-hidden rounded-2xl border-4 border-slate-50"></div>
                </div>

                {/* Footer Info */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                        <Box size={18} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-tight">
                            POSITION IDENTIFIER WITHIN THE FRAME
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            Supports EAN, UPC, CODE-128 & QR
                        </p>
                    </div>
                </div>
            </div>
            {/* Background Close Overlay */}
            <div className="absolute inset-0 -z-10 cursor-pointer" onClick={onClose} />
        </div>
    );
}
