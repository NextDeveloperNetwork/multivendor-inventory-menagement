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
  AlignCenter,
  AlignVerticalJustifyCenter,
  Grid3X3,
  Layers,
  Sparkles,
  Monitor,
  Smartphone,
  Save,
  History,
  Settings2,
  X,
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Rnd } from "react-rnd";
import { useReactToPrint } from "react-to-print";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/barcode/components/ui/slider";

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
  rotation?: number;
  fontWeight?: string;
}

function DesignerContent() {
  const [labelSize, setLabelSize] = useState({ width: 50, height: 40 });
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRotated, setIsRotated] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
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
          fontWeight: "900"
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
          fontSize: 12,
          rotation: 0,
          fontWeight: "900"
        });
      }

      setElements(newElements);
      setSelectedIds(["1"]);
    } else if (elements.length === 0) {
      setElements([{
        id: "default",
        type: "qrcode",
        x: 15,
        y: 10,
        width: 20,
        height: 20,
        content: "STUDIO-X-DESIGN",
        rotation: 0,
      }]);
      setSelectedIds(["default"]);
    }
  }, [searchParams]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Label_${labelSize.width}x${labelSize.height}`,
  });

  const addElement = (type: ElementType) => {
    const newElement: LabelElement = {
      id: Date.now().toString(),
      type,
      x: 10,
      y: 10,
      width: type === "barcode" ? 30 : 15,
      height: type === "barcode" ? 12 : 15,
      content: type === "text" ? "NEW TEXT" : (type === "barcode" ? "12345678" : "https://studio.x"),
      fontSize: type === "text" ? 8 : (type === "barcode" ? 6 : 0),
      barcodeFormat: "CODE128",
      barWidth: 1.1,
      rotation: 0,
      fontWeight: "900"
    };
    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
  };

  const deleteElements = (ids: string[]) => {
    setElements(elements.filter(el => !ids.includes(el.id)));
    setSelectedIds(selectedIds.filter(id => !ids.includes(id)));
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

  const selectedElement = elements.find(el => el.id === selectedIds[0]);
  const [clipboard, setClipboard] = useState<LabelElement[]>([]);

  const handleCopy = () => {
    const activeOnes = elements.filter(e => selectedIds.includes(e.id));
    if (activeOnes.length > 0) setClipboard(activeOnes);
  };

  const handlePaste = () => {
    if (clipboard.length > 0) {
      const newOnes = clipboard.map(el => ({
        ...el,
        id: Date.now().toString() + Math.random(),
        x: el.x + 3,
        y: el.y + 3,
      }));
      setElements(prev => [...prev, ...newOnes]);
      setSelectedIds(newOnes.map(n => n.id));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteElements(selectedIds);
        }
      }

      if (isMod && e.code === "KeyC") {
        e.preventDefault();
        handleCopy();
      }

      if (isMod && e.code === "KeyV") {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, elements, clipboard]);

  if (!mounted) return null;

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#f1f5f9] font-sans flex flex-col overflow-hidden">
      
      {/* 1. Fixed Integrated Studio Header */}
      <header className="flex-shrink-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 p-2 flex items-center justify-between gap-4 shadow-xl border-b border-white/10 relative z-50">
        
        {/* Left: Minimal Branding & Add Tools */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pl-2 pr-4 border-r border-white/10">
            <Sparkles size={16} className="text-white animate-pulse" />
            <h1 className="text-xs font-black text-white uppercase italic tracking-tighter leading-none">Studio X</h1>
          </div>
          
          <div className="flex items-center gap-1">
            <ActionButton icon={<QrCode size={13} />} label="QR" onClick={() => addElement("qrcode")} isDark />
            <ActionButton icon={<BarcodeIcon size={13} />} label="BAR" onClick={() => addElement("barcode")} isDark />
            <ActionButton icon={<Type size={13} />} label="TXT" onClick={() => addElement("text")} isDark />
            <ActionButton icon={<Square size={13} />} label="BOX" onClick={() => addElement("shape")} isDark />
          </div>
        </div>

        {/* Center: Live Stats & View Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/5">
             <div className="flex flex-col">
                <span className="text-[7px] font-black text-blue-200 uppercase tracking-widest">Workspace</span>
                <span className="text-[10px] font-black text-white tabular-nums italic leading-none">{labelSize.width}×{labelSize.height}mm</span>
             </div>
             <div className="w-px h-4 bg-white/10" />
             <div className="flex items-center gap-2">
                <button onClick={() => setZoom(Math.max(0.2, zoom - 0.1))} className="text-white/50 hover:text-white transition-colors"><Minimize2 size={12} /></button>
                <span className="text-[9px] font-black w-8 text-center text-white">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="text-white/50 hover:text-white transition-colors"><Maximize2 size={12} /></button>
                <div className="w-px h-3 bg-white/10 mx-0.5" />
                <button onClick={() => setShowGrid(!showGrid)} className={cn("w-6 h-6 flex items-center justify-center rounded transition-all", showGrid ? "bg-white text-indigo-600 shadow-lg" : "text-white/40")}>
                    <Grid3X3 size={12} />
                </button>
             </div>
          </div>
        </div>

        {/* Right: Print Action */}
        <div className="flex items-center gap-3 pr-2">
          <Button 
            onClick={handlePrint}
            className="h-10 px-6 bg-white text-indigo-700 hover:bg-white/90 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg"
          >
            <Printer size={14} /> Full Execute
          </Button>
        </div>
      </header>

      {/* 2. Main Workspace (Full Available Height) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Designer Bed (The Working Area) */}
        <main className="flex-1 bg-[#e2e8f0] relative flex items-center justify-center overflow-auto shadow-inner bg-canvas-dots">
            <motion.div
              layout
              style={{ scale: zoom }}
              className="relative transition-all duration-300 pointer-events-auto"
            >
              <div
                className={cn(
                  "bg-white relative transition-all duration-300 shadow-2xl overflow-hidden",
                  showGrid ? 'bg-canvas-grid-dark' : ''
                )}
                style={{
                  width: `${labelSize.width * MM_TO_PX}px`,
                  height: `${labelSize.height * MM_TO_PX}px`,
                  backgroundColor: '#ffffff'
                }}
                onClick={() => setSelectedIds([])}
              >
                {elements.map((el) => (
                  <Rnd
                    key={el.id}
                    size={{ width: el.width * MM_TO_PX, height: el.height * MM_TO_PX }}
                    position={{ x: el.x * MM_TO_PX, y: el.y * MM_TO_PX }}
                    onDragStop={(e, d) => updateElement(el.id, { x: Number((d.x / MM_TO_PX).toFixed(2)), y: Number((d.y / MM_TO_PX).toFixed(2)) })}
                    onResize={(e, dir, ref, delta, pos) => {
                      const finalHeightPx = ref.offsetHeight;
                      const newHeightMm = Number((finalHeightPx / MM_TO_PX).toFixed(2));
                      
                      if (el.type === "text" && el.fontSize && el.height > 0) {
                        const ratio = newHeightMm / el.height;
                        const newFontSize = Math.max(4, Number((el.fontSize * ratio).toFixed(1)));
                        updateElement(el.id, { 
                          width: Number((ref.offsetWidth / MM_TO_PX).toFixed(2)),
                          height: newHeightMm,
                          fontSize: newFontSize,
                          x: Number((pos.x / MM_TO_PX).toFixed(2)),
                          y: Number((pos.y / MM_TO_PX).toFixed(2)),
                        });
                      } else {
                        updateElement(el.id, {
                          width: Number((ref.offsetWidth / MM_TO_PX).toFixed(2)),
                          height: newHeightMm,
                          x: Number((pos.x / MM_TO_PX).toFixed(2)),
                          y: Number((pos.y / MM_TO_PX).toFixed(2)),
                        });
                      }
                    }}
                    bounds="parent"
                    dragGrid={[1, 1]}
                    resizeGrid={[1, 1]}
                    className={cn(
                      "flex items-center justify-center group/rnd cursor-move",
                      selectedIds.includes(el.id) ? 'z-50' : 'z-10'
                    )}
                    style={{
                      border: selectedIds.includes(el.id) ? '2px solid #4f46e5' : '1px solid transparent',
                      backgroundColor: selectedIds.includes(el.id) ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                    }}
                    onClick={(e: React.MouseEvent) => { 
                      e.stopPropagation(); 
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        if (selectedIds.includes(el.id)) {
                          setSelectedIds(selectedIds.filter(id => id !== el.id));
                        } else {
                          setSelectedIds([...selectedIds, el.id]);
                        }
                      } else {
                        setSelectedIds([el.id]);
                      }
                    }}
                  >
                    <div
                      className="w-full h-full pointer-events-none"
                      style={{
                        transform: `rotate(${el.rotation || 0}deg)`,
                        transformOrigin: 'center',
                      }}
                    >
                      <ElementRenderer el={el} />
                    </div>
                  </Rnd>
                ))}
              </div>

               {/* Absolute Size Info */}
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 vertical-text text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">
                {labelSize.height}mm Paper Vertical
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">
                {labelSize.width}mm Paper Horizontal
              </div>
            </motion.div>
        </main>

        {/* Sidebar (Fixed Width, Full Height) */}
        <aside className="w-[300px] bg-white border-l border-slate-200 p-4 space-y-6 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900">
                <Settings2 size={16} className="text-indigo-600" />
                <h2 className="text-[11px] font-black uppercase tracking-widest italic">Matrix</h2>
            </div>
          </div>

          {/* Config Matrix */}
          <div className="space-y-6 flex-1">
            {selectedElement ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] italic">Prop_{selectedElement.type.toUpperCase()}</p>
                    <div className="flex gap-2">
                        <button onClick={handleCopy} className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-100" title="Copy (CTRL+C)">
                            <History size={12} className="rotate-180" />
                        </button>
                        <button onClick={handlePaste} className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-100" title="Paste (CTRL+V)">
                            <Plus size={12} />
                        </button>
                        <button onClick={() => deleteElements(selectedIds)} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5 italic">Content</Label>
                        <Input
                            value={selectedElement.content}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-black italic shadow-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                        <div className="space-y-1.5">
                            <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5 italic">Rotation</Label>
                            <Select value={selectedElement.rotation?.toString() || "0"} onValueChange={(v: string) => updateElement(selectedElement.id, { rotation: parseInt(v) })}>
                                <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded-lg font-black text-[10px] italic shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200">
                                    {[0, 90, 180, 270].map(deg => (
                                        <SelectItem key={deg} value={deg.toString()} className="text-[9px] font-bold uppercase">{deg}°</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5 italic">Density</Label>
                            <Input
                                type="number"
                                step={selectedElement.type === "barcode" ? 0.1 : 1}
                                value={selectedElement.type === "barcode" ? (selectedElement.barWidth || 1.1) : (selectedElement.fontSize || 8)}
                                onChange={(e) => updateElement(selectedElement.id, selectedElement.type === "barcode" ? { barWidth: parseFloat(e.target.value) } : { fontSize: parseInt(e.target.value) })}
                                className="h-9 bg-slate-50 border-slate-200 rounded-lg text-[10px] font-black italic shadow-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-50">
                        <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center block italic">Alignment</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => alignElement(selectedElement.id, 'h')} className="h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center gap-1 group hover:bg-indigo-600 transition-all shadow-none">
                                <AlignCenter size={12} className="text-indigo-600 group-hover:text-white" />
                                <span className="text-[7px] font-black text-indigo-400 group-hover:text-white uppercase">Center X</span>
                            </button>
                            <button onClick={() => alignElement(selectedElement.id, 'v')} className="h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center gap-1 group hover:bg-indigo-600 transition-all shadow-none">
                                <AlignVerticalJustifyCenter size={12} className="text-indigo-600 group-hover:text-white" />
                                <span className="text-[7px] font-black text-indigo-400 group-hover:text-white uppercase">Center Y</span>
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <MousePointer2 size={24} strokeWidth={1} className="opacity-40 animate-pulse" />
                <p className="text-[8px] font-black uppercase tracking-[0.2em] italic">Select Node</p>
                <div className="flex flex-col items-center opacity-40 font-black text-[6px] gap-1 uppercase tracking-widest">
                    <span>CTRL+C / CTRL+V</span>
                    <span>DEL / SHIFT+CLICK</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
                 <div className="flex items-center gap-2">
                    <Layout size={12} className="text-slate-400" />
                    <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">Landscape Node</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">W (mm)</Label>
                        <Input type="number" value={labelSize.width} onChange={(e) => setLabelSize({ ...labelSize, width: Number(e.target.value) })} className="h-9 bg-slate-50 border-slate-200 rounded-lg text-[10px] font-black italic shadow-none" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">H (mm)</Label>
                        <Input type="number" value={labelSize.height} onChange={(e) => setLabelSize({ ...labelSize, height: Number(e.target.value) })} className="h-9 bg-slate-50 border-slate-200 rounded-lg text-[10px] font-black italic shadow-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Direction</Label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
                        <button 
                            onClick={() => setIsRotated(false)} 
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                                !isRotated ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'
                            )}
                        >
                            <Smartphone size={10} /> Direct
                        </button>
                        <button 
                            onClick={() => setIsRotated(true)} 
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                                isRotated ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'
                            )}
                        >
                            <RotateCw size={10} className="rotate-90" /> Offset 90
                        </button>
                    </div>
                 </div>
            </div>
        </aside>
      </div>

      {/* HIDDEN PRINT CAPTURE */}
      <div className="hidden print:block">
        <div ref={printRef} id="studio-print-target">
          <div style={{
            width: `${isRotated ? labelSize.height : labelSize.width}mm`,
            height: `${isRotated ? labelSize.width : labelSize.height}mm`,
            position: 'relative',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}>
             <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${labelSize.width}mm`,
                height: `${labelSize.height}mm`,
                transform: `translate(-50%, -50%) ${isRotated ? 'rotate(90deg)' : 'none'}`,
                transformOrigin: 'center',
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
      </div>

      <style jsx global>{`
        .bg-canvas-dots {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .bg-canvas-grid-dark {
          background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px);
          background-size: 10px 10px;
        }
        .vertical-text {
          writing-mode: vertical-rl;
        }
        @media print {
          @page {
            size: ${isRotated ? labelSize.height : labelSize.width}mm ${isRotated ? labelSize.width : labelSize.height}mm;
            margin: 0;
          }
          body { margin: 0 !important; padding: 0 !important; }
          * { visibility: hidden; }
          #studio-print-target, #studio-print-target * { visibility: visible; }
          #studio-print-target { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
        }
      `}</style>
    </div>
  );
}

function ActionButton({ icon, label, onClick, isDark = false }: { icon: React.ReactNode, label: string, onClick: () => void, isDark?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-[8px] font-black uppercase tracking-widest italic",
        isDark 
            ? "bg-white/10 text-white border border-white/10 hover:bg-white hover:text-indigo-700" 
            : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white"
      )}
    >
      {icon} {label}
    </button>
  );
}

function ElementRenderer({ el, isPrinting = false }: { el: LabelElement, isPrinting?: boolean }) {
  if (el.type === "barcode") {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white">
        <BarcodeGenerator
          value={el.content}
          format={el.barcodeFormat as any}
          width={el.barWidth || 1.1}
          height={el.height * MM_TO_PX * 0.75}
          displayValue={true}
          fontSize={el.fontSize || 8}
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
      <div className="flex items-center justify-center w-full h-full bg-white p-[5%]">
        <QRCodeSVG
          value={el.content}
          size={512}
          level="H"
          marginSize={0}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        border: `1px solid #000`,
        backgroundColor: 'transparent',
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <DesignerContent />
    </Suspense>
  );
}
