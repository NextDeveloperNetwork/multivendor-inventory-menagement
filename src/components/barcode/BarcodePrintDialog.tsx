"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BarcodeGenerator } from "./components/BarcodeGenerator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Printer, Settings, X, QrCode, Barcode as BarcodeIcon, RotateCw } from "lucide-react";
import { Label } from "./components/ui/label";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";

interface BarcodePrintDialogProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol?: string;
}

export default function BarcodePrintDialog({ product, isOpen, onClose, currencySymbol = "$" }: BarcodePrintDialogProps) {
    const [labelSize, setLabelSize] = useState({ width: 50, height: 40 });
    const [showQR, setShowQR] = useState(true);
    const [isRotated, setIsRotated] = useState(true);
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const MM_TO_PX = 3.7795275591;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Label_${product?.name || 'Asset'}`,
    });

    if (!product) return null;

    // Adjust graphic size based on orientation
    const graphicSize = Math.min(labelSize.width, labelSize.height) * 0.5;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-white rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-black p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Printer size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black uppercase italic tracking-tighter">Print Label</DialogTitle>
                            <DialogDescription className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Asset: {product.name}</DialogDescription>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Preview Area */}
                    <div className="space-y-4 flex flex-col items-center">
                        <Label className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Label Preview</Label>
                        <div className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden p-8">
                            <div className={`preview-wrapper ${isRotated ? 'rotated' : ''}`} style={{
                                width: `${labelSize.width * MM_TO_PX}px`,
                                height: `${labelSize.height * MM_TO_PX}px`,
                            }}>
                                <div
                                    ref={printRef}
                                    className="bg-white flex items-center gap-1 overflow-hidden print-content"
                                    style={{
                                        width: `${labelSize.width}mm`,
                                        height: `${labelSize.height}mm`,
                                        padding: '1mm',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div className="graphic-container" style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {showQR ? (
                                            <QRCodeSVG
                                                value={product.barcode || product.sku}
                                                size={Math.min(labelSize.width * 0.48, labelSize.height - 2) * MM_TO_PX}
                                                level="M"
                                            />
                                        ) : (
                                            <BarcodeGenerator
                                                value={product.barcode || product.sku}
                                                format="CODE128"
                                                width={1.6}
                                                height={(labelSize.height - 2) * MM_TO_PX}
                                                displayValue={false}
                                                margin={0}
                                                background="transparent"
                                                lineColor="#000000"
                                            />
                                        )}
                                    </div>
                                    <div className="details-container" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <div style={{
                                            transform: 'rotate(90deg)',
                                            transformOrigin: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            width: `${labelSize.height - 1}mm`,
                                            maxHeight: `${labelSize.width * 0.48}mm`,
                                            textAlign: 'center'
                                        }}>
                                            <div className="title" style={{ width: '100%', fontWeight: '800', fontSize: '8pt', lineHeight: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: '1.5mm', color: '#333', textTransform: 'uppercase' }}>{product.name?.substring(0, 12)}</div>
                                            
                                            {product.cost !== undefined && product.cost !== null && (
                                                <div className="cost" style={{ width: '100%', fontWeight: '1000', fontSize: '15pt', color: '#000', lineHeight: '1', marginBottom: '1mm', letterSpacing: '-0.05em' }}>
                                                    C:{currencySymbol}{product.cost}
                                                </div>
                                            )}

                                            {product.price !== undefined && product.price !== null && (
                                                <div className="price" style={{ width: '100%', fontWeight: '1000', fontSize: '15pt', color: '#000', lineHeight: '1', letterSpacing: '-0.05em' }}>
                                                    S:{currencySymbol}{product.price}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Area */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Settings size={16} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Settings</h3>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] text-slate-400 font-bold uppercase">Element Type</Label>
                                <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                                    <button
                                        onClick={() => setShowQR(false)}
                                        className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!showQR ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <BarcodeIcon size={14} /> Barcode
                                    </button>
                                    <button
                                        onClick={() => setShowQR(true)}
                                        className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showQR ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <QrCode size={14} /> QR Code
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] text-slate-400 font-bold uppercase">Rotation (Orientation)</Label>
                                <button
                                    onClick={() => setIsRotated(!isRotated)}
                                    className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRotated ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <RotateCw size={14} className={isRotated ? "rotate-90" : ""} />
                                    {isRotated ? "Rotated 90° (Horizontal)" : "No Rotation (Vertical)"}
                                </button>
                                <p className="text-[8px] text-slate-400 italic">Toggle this if your print comes out vertical on a portrait roll.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] text-slate-400 font-bold uppercase">Width (mm)</Label>
                                    <Input
                                        type="number"
                                        value={labelSize.width}
                                        onChange={(e) => setLabelSize({ ...labelSize, width: Number(e.target.value) })}
                                        className="h-10 text-xs font-bold bg-slate-50 border-none rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] text-slate-400 font-bold uppercase">Height (mm)</Label>
                                    <Input
                                        type="number"
                                        value={labelSize.height}
                                        onChange={(e) => setLabelSize({ ...labelSize, height: Number(e.target.value) })}
                                        className="h-10 text-xs font-bold bg-slate-50 border-none rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex gap-4">
                                <Button onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    Cancel
                                </Button>
                                <Button onClick={handlePrint} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                    Print Now
                                </Button>
                            </div>
                            <Button
                                onClick={() => router.push(`/admin/barcode?content=${encodeURIComponent(product.barcode || product.sku)}&name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price || '')}`)}
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-200"
                            >
                                <Settings className="w-4 h-4 mr-2" /> Open in Advanced Designer
                            </Button>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    .preview-wrapper {
                        background: white;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        border: 1px solid #e2e8f0;
                        transition: transform 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .preview-wrapper.rotated {
                        transform: rotate(90deg);
                    }
                    @media print {
                        @page {
                            size: ${labelSize.width}mm ${labelSize.height}mm;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .print-content {
                            transform: ${isRotated ? 'rotate(90deg)' : 'none'};
                            transform-origin: center;
                            width: ${labelSize.width}mm !important;
                            height: ${labelSize.height}mm !important;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            margin-top: -${labelSize.height / 2}mm;
                            margin-left: -${labelSize.width / 2}mm;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
