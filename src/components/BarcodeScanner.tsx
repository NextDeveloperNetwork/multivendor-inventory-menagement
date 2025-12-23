'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                <div className="p-6 bg-black text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Camera size={20} className="text-blue-500" />
                        <h3 className="font-black uppercase tracking-tight italic">Optical Asset Scanner</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div id="reader" className="w-full"></div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Position barcode within the frame to synchronize
                    </p>
                </div>
            </div>
        </div>
    );
}
