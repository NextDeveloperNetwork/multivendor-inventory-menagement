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
import { Printer, Settings, X, QrCode, Barcode as BarcodeIcon, RotateCw, Layout, Smartphone, Monitor, Settings2 } from "lucide-react";
import { Label } from "./components/ui/label";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/lib/utils";

interface BarcodePrintDialogProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol?: string;
}

export default function BarcodePrintDialog({ product, isOpen, onClose, currencySymbol = "$" }: BarcodePrintDialogProps) {
    const [labelSize, setLabelSize] = useState({ width: 50, height: 40 });
    const [showQR, setShowQR] = useState(true);
    const [isRotated, setIsRotated] = useState(false);
    const [textScale, setTextScale] = useState(1);
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const MM_TO_PX = 3.7795275591;

    // Physical page size sent to the printer:
    const pageW = isRotated ? labelSize.height : labelSize.width;
    const pageH = isRotated ? labelSize.width : labelSize.height;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Label_${product?.name || "Asset"}`,
    });

    if (!product) return null;

    const codeValue = product.barcode || product.sku || "N/A";
    const shortSide = Math.min(labelSize.width, labelSize.height);
    const codeSizeMM = shortSide * 0.7;
    const codeSizePX = codeSizeMM * MM_TO_PX;

    const labelContent = (isPrinting = false) => (
        <div
            className="print-label-container"
            style={{
                width: `${labelSize.width}mm`,
                height: `${labelSize.height}mm`,
                padding: "2mm",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: "1.5mm",
                overflow: "hidden",
                background: "white",
                position: "relative",
            }}
        >
            {/* Symbol Layer */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {showQR ? (
                    <QRCodeSVG
                        value={codeValue}
                        size={codeSizePX}
                        level="M"
                    />
                ) : (
                    <BarcodeGenerator
                        value={codeValue}
                        format="CODE128"
                        width={isPrinting ? 1.4 : 1.2}
                        height={codeSizePX * 0.8}
                        displayValue={false}
                        margin={0}
                        background="transparent"
                        lineColor="#000000"
                    />
                )}
            </div>

            {/* Text Layer (Rotated 90 by default for roll optimization) */}
            <div style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <div style={{
                    transform: "rotate(90deg)",
                    transformOrigin: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: `${labelSize.height - 4}mm`,
                    textAlign: "center",
                    gap: "0.5mm",
                    scale: textScale,
                }}>
                    <div style={{ fontWeight: 900, fontSize: "7pt", lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#000", textTransform: "uppercase", width: "100%" }}>
                        {product.name}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "5pt", lineHeight: 1, color: "#666", width: "100%", fontFamily: "monospace" }}>
                         {product.sku || product.barcode}
                    </div>
                    {product.price !== undefined && (
                        <div style={{ fontWeight: 900, fontSize: "14pt", color: "#000", lineHeight: 1, marginTop: "1mm", letterSpacing: "-0.05em" }}>
                            {currencySymbol}{product.price}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[#f8fafc] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                
                {/* Identity Banner Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shrink-0">
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />
                    
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                                <Printer size={24} className="text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none text-white">Label Forge</DialogTitle>
                                <DialogDescription className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                                    Target Asset: {product.name}
                                </DialogDescription>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-white/10">
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                    
                    {/* Visualizer Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout size={12} /> Studio Impression
                             </Label>
                             <div className="text-[9px] font-bold text-slate-400 italic">
                                {labelSize.width}mm × {labelSize.height}mm
                             </div>
                        </div>
                        
                        <div className="relative aspect-[4/3] bg-white rounded-[2rem] border-2 border-slate-200/50 shadow-inner flex items-center justify-center overflow-hidden p-12 group">
                             {/* Background Grid */}
                             <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
                             
                             <div
                                className={cn(
                                    "relative bg-white shadow-2xl border border-slate-200 transition-all duration-500",
                                    isRotated ? "rotate-90" : ""
                                )}
                                style={{
                                    width: `${labelSize.width * MM_TO_PX}px`,
                                    height: `${labelSize.height * MM_TO_PX}px`,
                                }}
                            >
                                {labelContent()}
                                
                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        
                        <p className="text-center text-[9px] text-slate-400 font-medium italic">
                            This preview represents the physical label dimensions based on 96DPI screen rendering.
                        </p>
                    </div>

                    {/* Controls Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-6 shadow-sm">
                            <div className="flex items-center gap-3 text-slate-900">
                                <Settings2 className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest">Configuration</h3>
                            </div>

                            {/* Symbology Toggle */}
                            <div className="space-y-3">
                                <Label className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-1">Symbology</Label>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                    <button
                                        onClick={() => setShowQR(false)}
                                        className={cn(
                                            "flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                            !showQR ? "bg-white shadow-md text-indigo-600" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <BarcodeIcon size={14} /> Barcode
                                    </button>
                                    <button
                                        onClick={() => setShowQR(true)}
                                        className={cn(
                                            "flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                            showQR ? "bg-white shadow-md text-indigo-600" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <QrCode size={14} /> QR Code
                                    </button>
                                </div>
                            </div>

                            {/* Orientation */}
                            <div className="space-y-3">
                                <Label className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-1">Output Orientation</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsRotated(false)}
                                        className={cn(
                                            "h-12 flex items-center justify-center gap-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                            !isRotated ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-400 border-slate-200"
                                        )}
                                    >
                                        <Smartphone size={14} /> Portrait
                                    </button>
                                    <button
                                        onClick={() => setIsRotated(true)}
                                        className={cn(
                                            "h-12 flex items-center justify-center gap-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                            isRotated ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-400 border-slate-200"
                                        )}
                                    >
                                        <RotateCw size={14} className="rotate-90" /> Landscape
                                    </button>
                                </div>
                            </div>

                            {/* Sizing Matrix */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div className="space-y-2">
                                    <Label className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-1">Width (mm)</Label>
                                    <Input
                                        type="number"
                                        value={labelSize.width}
                                        onChange={(e) => setLabelSize({ ...labelSize, width: Number(e.target.value) })}
                                        className="h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-black italic focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-1">Height (mm)</Label>
                                    <Input
                                        type="number"
                                        value={labelSize.height}
                                        onChange={(e) => setLabelSize({ ...labelSize, height: Number(e.target.value) })}
                                        className="h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-black italic focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tactical Actions */}
                        <div className="space-y-3">
                            <Button
                                onClick={handlePrint}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 active:scale-95 transition-all italic border-b-4 border-indigo-800"
                            >
                                <Printer size={18} className="mr-2" /> Execute Print
                            </Button>
                            <Button
                                onClick={() =>
                                    router.push(
                                        `/admin/barcode?content=${encodeURIComponent(codeValue)}&name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price || "")}`
                                    )
                                }
                                variant="outline"
                                className="w-full h-12 bg-white border-2 border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Layout className="w-4 h-4" /> Open Advanced Studio
                            </Button>
                        </div>
                    </div>
                </div>

                {/* HIDDEN PRINT ENGINE */}
                <div style={{ display: 'none' }}>
                    <div ref={printRef} id="thermal-print-capture">
                        <style>{`
                            @page {
                                size: ${pageW}mm ${pageH}mm;
                                margin: 0;
                            }
                            @media print {
                                body {
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    overflow: hidden;
                                }
                                #thermal-print-capture {
                                    display: block !important;
                                }
                            }
                        `}</style>
                        <div style={{
                            width: `${pageW}mm`,
                            height: `${pageH}mm`,
                            backgroundColor: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                             <div style={{
                                width: `${labelSize.width}mm`,
                                height: `${labelSize.height}mm`,
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) ${isRotated ? 'rotate(90deg)' : ''}`,
                                transformOrigin: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                             }}>
                                {labelContent(true)}
                             </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
