"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BarcodeGenerator } from "@/components/barcode/components/BarcodeGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/barcode/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/barcode/components/ui/select";
import { Slider } from "@/components/barcode/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/barcode/components/ui/card";
import {
  Printer,
  Settings,
  Plus,
  Trash2,
  Square,
  Type,
  QrCode,
  Barcode as BarcodeIcon,
  RotateCw,
  Layout,
  MousePointer2,
  Scissors,
  AlignCenter,
  AlignVerticalJustifyCenter,
  Grid3X3,
  Layers,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Rnd } from "react-rnd";
import { useReactToPrint } from "react-to-print";
import { motion, AnimatePresence } from "framer-motion";

// Constants
const MM_TO_PX = 3.7795275591;

// Types
type ElementType = "barcode" | "qrcode" | "text" | "shape";

interface LabelElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  barcodeFormat?: string;
  barWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  rotation?: number;
}

function DesignerContent() {
  const [labelSize, setLabelSize] = useState({ width: 50, height: 40 });
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRotated, setIsRotated] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const content = searchParams.get("content");
    const name = searchParams.get("name");
    const price = searchParams.get("price");

    if (content) {
      const newElements: LabelElement[] = [
        {
          id: "1",
          type: "qrcode",
          x: 15,
          y: 5,
          width: 20,
          height: 20,
          content: content,
          rotation: 0,
        }
      ];

      if (name) {
        newElements.push({
          id: "2",
          type: "text",
          x: 5,
          y: 28,
          width: 40,
          height: 4,
          content: name,
          fontSize: 8,
          rotation: 0,
        });
      }

      if (price) {
        newElements.push({
          id: "3",
          type: "text",
          x: 5,
          y: 33,
          width: 40,
          height: 5,
          content: price,
          fontSize: 10,
          rotation: 0,
        });
      }

      setElements(newElements);
      setSelectedId("1");
    } else if (elements.length === 0) {
      // Default placeholder if empty
      setElements([{
        id: "default",
        type: "qrcode",
        x: 15,
        y: 10,
        width: 20,
        height: 20,
        content: "MASTER-STUDIO",
        rotation: 0,
      }]);
      setSelectedId("default");
    }
  }, [searchParams]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Studio_Design",
  });

  const addElement = (type: ElementType) => {
    const newElement: LabelElement = {
      id: Date.now().toString(),
      type,
      x: 10,
      y: 10,
      width: type === "barcode" ? 30 : 15,
      height: type === "barcode" ? 12 : 15,
      content: type === "text" ? "NEW TEXT" : "12345678",
      fontSize: 8,
      barcodeFormat: "CODE128",
      barWidth: 0.5,
      rotation: 0,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const alignElement = (id: string, axis: 'h' | 'v') => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    if (axis === 'h') {
      updateElement(id, { x: (labelSize.width - el.width) / 2 });
    } else {
      updateElement(id, { y: (labelSize.height - el.height) / 2 });
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[400px_1fr] h-screen print:block">

        {/* --- LEFT PANEL: STUDIO TOOLS --- */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col h-full print:hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter italic">Studio X</h1>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Pro Labeling Engine</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 pb-32">

            {/* Quick Actions */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Library</p>
                <div className="h-px bg-white/5 flex-1 ml-4" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton icon={<QrCode size={16} />} label="QR CODE" onClick={() => addElement("qrcode")} color="indigo" />
                <ActionButton icon={<BarcodeIcon size={16} />} label="BARCODE" onClick={() => addElement("barcode")} color="blue" />
                <ActionButton icon={<Type size={16} />} label="TEXT" onClick={() => addElement("text")} color="slate" />
                <ActionButton icon={<Square size={16} />} label="SHAPE" onClick={() => addElement("shape")} color="slate" />
              </div>
            </section>

            {/* Selection Editor */}
            <AnimatePresence mode="wait">
              {selectedElement ? (
                <motion.section
                  key={selectedElement.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="space-y-6 pt-6 border-t border-white/5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Properties: {selectedElement.type}</p>
                    </div>
                    <button onClick={() => deleteElement(selectedElement.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Content */}
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Content</Label>
                      <Input
                        value={selectedElement.content}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="h-12 bg-white/5 border-none rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>

                    {/* Quick Alignment */}
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Layout Alignment</Label>
                      <div className="flex gap-2">
                        <button onClick={() => alignElement(selectedElement.id, 'h')} className="flex-1 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all">
                          <AlignCenter size={14} /> Center X
                        </button>
                        <button onClick={() => alignElement(selectedElement.id, 'v')} className="flex-1 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all">
                          <AlignVerticalJustifyCenter size={14} /> Center Y
                        </button>
                      </div>
                    </div>

                    {/* Rotation */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Rotation</span>
                        <span className="text-indigo-400">{selectedElement.rotation}°</span>
                      </div>
                      <Slider
                        value={[selectedElement.rotation || 0]}
                        min={0} max={270} step={90}
                        onValueChange={(v) => updateElement(selectedElement.id, { rotation: v[0] })}
                        className="cursor-pointer"
                      />
                    </div>

                    {/* Sizing specifics */}
                    {(selectedElement.type === "text" || selectedElement.type === "barcode") && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Font Weight / Size</span>
                          <span className="text-indigo-400">{selectedElement.fontSize}px</span>
                        </div>
                        <Slider value={[selectedElement.fontSize || 8]} min={4} max={40} step={1} onValueChange={(v) => updateElement(selectedElement.id, { fontSize: v[0] })} />
                      </div>
                    )}
                  </div>
                </motion.section>
              ) : (
                <section className="h-40 flex flex-col items-center justify-center gap-4 border border-dashed border-white/10 rounded-3xl opacity-40">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                    <MousePointer2 size={24} className="text-slate-500" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pick an element to start</p>
                </section>
              )}
            </AnimatePresence>

            {/* Global Settings */}
            <section className="space-y-6 pt-6 border-t border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Global Workspace</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Width (mm)</Label>
                  <Input type="number" value={labelSize.width} onChange={(e) => setLabelSize({ ...labelSize, width: Number(e.target.value) })} className="h-10 bg-white/5 border-none rounded-xl text-xs font-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Height (mm)</Label>
                  <Input type="number" value={labelSize.height} onChange={(e) => setLabelSize({ ...labelSize, height: Number(e.target.value) })} className="h-10 bg-white/5 border-none rounded-xl text-xs font-black" />
                </div>
              </div>

              <div className="flex bg-white/5 p-1 rounded-2xl">
                <button onClick={() => setIsRotated(false)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isRotated ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}>
                  Portrait
                </button>
                <button onClick={() => setIsRotated(true)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRotated ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}>
                  Landscape
                </button>
              </div>
            </section>
          </div>

          {/* Footer Branding */}
          <div className="p-8 border-t border-white/5 flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2">
              <Layers size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{elements.length} LAYER(S)</span>
            </div>
          </div>
        </motion.div>

        {/* --- MAIN AREA: THE DESIGNER BED --- */}
        <div className="flex flex-col h-full overflow-hidden relative">

          {/* Top Bar Indicators */}
          <div className="absolute top-0 inset-x-0 h-20 flex items-center justify-center gap-8 z-50 print:hidden pointer-events-none">
            <div className="px-6 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-4 pointer-events-auto overflow-hidden">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                  <Grid3X3 size={14} />
                </button>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                DPI: <span className="text-white">96 (STD)</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Zoom: <span className="text-white">100%</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <Button onClick={handlePrint} className="bg-white text-black hover:bg-indigo-50 rounded-lg h-9 text-[9px] font-black uppercase tracking-widest px-4">
                Generate Print
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-20 bg-studio-dots overflow-auto custom-scrollbar">

            <motion.div
              layout
              className="relative group print:hidden transition-all duration-500"
            >
              {/* Studio Shadows */}
              <div className="absolute inset-0 bg-black/40 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />

              {/* Selection Border */}
              <div className="absolute -inset-1 border border-indigo-500/20 rounded-lg pointer-events-none" />

              <div
                className={`bg-white relative transition-all duration-300 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden ${showGrid ? 'bg-canvas-grid' : ''}`}
                style={{
                  width: `${labelSize.width * MM_TO_PX}px`,
                  height: `${labelSize.height * MM_TO_PX}px`,
                }}
                onClick={() => setSelectedId(null)}
              >
                {elements.map((el) => (
                  <Rnd
                    key={el.id}
                    size={{ width: el.width * MM_TO_PX, height: el.height * MM_TO_PX }}
                    position={{ x: el.x * MM_TO_PX, y: el.y * MM_TO_PX }}
                    onDragStop={(e, d) => updateElement(el.id, { x: Number((d.x / MM_TO_PX).toFixed(2)), y: Number((d.y / MM_TO_PX).toFixed(2)) })}
                    onResizeStop={(e, dir, ref, delta, pos) => updateElement(el.id, {
                      width: Number((parseFloat(ref.style.width) / MM_TO_PX).toFixed(2)),
                      height: Number((parseFloat(ref.style.height) / MM_TO_PX).toFixed(2)),
                      x: Number((pos.x / MM_TO_PX).toFixed(2)),
                      y: Number((pos.y / MM_TO_PX).toFixed(2)),
                    })}
                    bounds="parent"
                    className={`flex items-center justify-center group/rnd cursor-move transition-shadow ${selectedId === el.id ? 'z-50' : 'z-10'}`}
                    style={{
                      border: selectedId === el.id ? '2px solid #6366f1' : '1px solid transparent',
                    }}
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedId(el.id); }}
                  >
                    <div
                      className="w-full h-full pointer-events-none transition-all duration-300"
                      style={{
                        transform: `rotate(${el.rotation || 0}deg)`,
                        transformOrigin: 'center',
                      }}
                    >
                      <ElementRenderer el={el} />
                    </div>
                    {/* Element Label */}
                    {selectedId === el.id && (
                      <div className="absolute -top-7 left-0 bg-indigo-600 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-lg">
                        {el.type} <ChevronRight size={8} /> {Math.round(el.width)}mm
                      </div>
                    )}
                  </Rnd>
                ))}
              </div>

              {/* Size Overlays */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 vertical-text uppercase tracking-widest">
                {labelSize.height}MM HEIGHT
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {labelSize.width}MM WIDTH
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- PRINT ONLY ENGINE --- */}
        <div className="hidden print:block">
          <div ref={printRef} id="barcode-designer-print-section">
            <div style={{
              position: 'relative',
              width: `${labelSize.width}mm`,
              height: `${labelSize.height}mm`,
              overflow: 'hidden',
              backgroundColor: 'white'
            }}>
              {elements.map(el => (
                <div key={el.id} style={{
                  position: 'absolute',
                  left: `${el.x}mm`,
                  top: `${el.y}mm`,
                  width: `${el.width}mm`,
                  height: `${el.height}mm`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${el.rotation || 0}deg)`,
                  transformOrigin: 'center',
                }}>
                  <ElementRenderer el={el} isPrinting />
                </div>
              ))}
            </div>
          </div>
        </div>

        <style jsx global>{`
          .bg-studio-dots {
            background-color: #0f1115;
            background-image: radial-gradient(#ffffff0a 1px, transparent 1px);
            background-size: 24px 24px;
          }
          .bg-canvas-grid {
            background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px);
            background-size: 10px 10px;
          }
          .vertical-text {
            writing-mode: vertical-rl;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          @media print {
            @page {
              size: ${labelSize.width}mm ${labelSize.height}mm;
              margin: 0;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }
            #barcode-designer-print-section {
              width: ${labelSize.width}mm;
              height: ${labelSize.height}mm;
              display: block !important;
              background: white;
              transform: ${isRotated ? 'rotate(90deg)' : 'none'};
              transform-origin: center;
              position: absolute;
              top: 50%;
              left: 50%;
              margin-top: -${labelSize.height / 2}mm;
              margin-left: -${labelSize.width / 2}mm;
            }
            * { 
              visibility: hidden;
            }
            #barcode-designer-print-section, #barcode-designer-print-section * {
              visibility: visible;
            }
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: string }) {
  const themes = {
    indigo: "hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/10",
    blue: "hover:bg-blue-500/20 text-blue-400 border-blue-500/10",
    slate: "hover:bg-white/10 text-slate-400 border-white/5"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-4 bg-white/[0.02] border rounded-[1.5rem] transition-all group ${themes[color as keyof typeof themes]}`}
    >
      <div className="group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
    </motion.button>
  );
}

function ElementRenderer({ el, isPrinting = false }: { el: LabelElement, isPrinting?: boolean }) {
  if (el.type === "barcode") {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden bg-white">
        <BarcodeGenerator
          value={el.content}
          format={el.barcodeFormat as any}
          width={el.barWidth || 0.6}
          height={el.height * MM_TO_PX * 0.7}
          displayValue={true}
          fontSize={el.fontSize || 6}
          margin={0}
          background="transparent"
          lineColor="#000000"
          textAlign="center"
          textPosition="bottom"
          textMargin={1}
        />
      </div>
    );
  }

  if (el.type === "qrcode") {
    return (
      <div className="flex items-center justify-center w-full h-full overflow-hidden bg-white p-[2%]">
        <QRCodeSVG
          value={el.content}
          size={256}
          level="H"
          marginSize={0}
          style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        border: `${el.borderWidth || 1}px solid ${el.borderColor || '#000'}`,
        backgroundColor: el.backgroundColor || 'transparent',
        boxSizing: 'border-box'
      }} />
    );
  }

  return (
    <div style={{
      fontSize: `${el.fontSize}px`,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      wordBreak: 'break-all',
      textAlign: 'center',
      lineHeight: 1.1,
      padding: '2px',
      boxSizing: 'border-box',
      fontWeight: '900',
      color: '#000',
      textTransform: 'uppercase'
    }}>
      {el.content}
    </div>
  );
}

export default function BarcodePrinterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f1115]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div></div>}>
      <DesignerContent />
    </Suspense>
  );
}
