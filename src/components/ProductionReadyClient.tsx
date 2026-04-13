'use client';

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, AlertTriangle, ArrowRight, History, PackageCheck, Filter, Search, Warehouse, AlertCircle, Trash2 } from 'lucide-react';

interface AccessoryUsage { id: string; accessoryId: string; usageQuantity: number; processName?: string; }
interface ProcessRequirement { id: string; processName: string; unitsPerHour: number; sequence: number; }
interface ProductionItem { id: string; name: string; sku: string; type: 'MAIN' | 'ACCESSORY'; unit: string; stockQuantity: number; processes: ProcessRequirement[]; bom: AccessoryUsage[]; businessId?: string; }
interface ProductionOrder { id: string; mainPartId: string; quantity: number; priority: number; status: 'QUEUED' | 'IN_PRODUCTION' | 'COMPLETED'; finishedQuantity?: number; businessId?: string; }
interface ReadyToShipItem { id: string; orderId: string; name: string; sku: string; quantity: number; unit: string; confirmDate: string; businessId?: string; }

export default function ProductionReadyClient({ businessId }: { businessId?: string }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [items, setItems] = useState<ProductionItem[]>([]);
    const [readyInventory, setReadyInventory] = useState<ReadyToShipItem[]>([]);
    
    const getK = (k: string) => businessId ? `${k}_${businessId}` : k;

    useEffect(() => {
        const loadAggregated = (baseKey: string) => {
            const results: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k === baseKey || k.startsWith(`${baseKey}_`))) {
                    const bid = k.includes('_') ? k.split('_').pop() : '';
                    const d = JSON.parse(localStorage.getItem(k) || '[]');
                    results.push(...d.map((x: any) => ({ ...x, businessId: bid })));
                }
            }
            // Deduplicate by ID to prevent infinite accumulation
            const unique = new Map();
            results.forEach(item => {
                if (!unique.has(item.id)) unique.set(item.id, item);
            });
            return Array.from(unique.values());
        };

        if (!businessId) {
            setOrders(loadAggregated('prod_ords_v2'));
            setItems(loadAggregated('prod_items_v3'));
            setReadyInventory(loadAggregated('prod_ready_v1'));
        } else {
            const o = localStorage.getItem(getK('prod_ords_v2'));
            const i = localStorage.getItem(getK('prod_items_v3'));
            const r = localStorage.getItem(getK('prod_ready_v1'));
            if (o) setOrders(JSON.parse(o));
            if (i) setItems(JSON.parse(i));
            if (r) setReadyInventory(JSON.parse(r));
        }
        setIsLoaded(true);
    }, [businessId]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(getK('prod_ready_v1'), JSON.stringify(readyInventory));
        localStorage.setItem(getK('prod_ords_v2'), JSON.stringify(orders));
        localStorage.setItem(getK('prod_items_v3'), JSON.stringify(items));
    }, [readyInventory, orders, items, isLoaded, businessId]);

    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
    const [confirmQty, setConfirmQty] = useState<number>(0);
    const [isConfirming, setIsConfirming] = useState(false);

    const openConfirmation = (order: ProductionOrder) => {
        setSelectedOrder(order);
        setConfirmQty(order.quantity - (order.finishedQuantity || 0));
        setIsConfirming(true);
    };

    const handleFinalConfirm = () => {
        if (!selectedOrder || confirmQty <= 0) return;
        
        const product = items.find(i => i.id === selectedOrder.mainPartId);
        if (!product) return;

        // 1. Calculate and deduct materials
        const newItems = [...items];
        let materialShortage = false;
        
        product.bom.forEach(bomItem => {
            const materialIdx = newItems.findIndex(i => i.id === bomItem.accessoryId);
            if (materialIdx !== -1) {
                const required = bomItem.usageQuantity * confirmQty;
                if (newItems[materialIdx].stockQuantity < required) {
                    materialShortage = true;
                }
                newItems[materialIdx] = {
                    ...newItems[materialIdx],
                    stockQuantity: Math.max(0, newItems[materialIdx].stockQuantity - required)
                };
            }
        });

        if (materialShortage && !confirm('Some materials have insufficient stock for this quantity. Proceed anyway?')) return;

        // 2. Add to Ready to Ship
        const newReadyItem: ReadyToShipItem = {
            id: Math.random().toString(36).substring(2, 9),
            orderId: selectedOrder.id,
            name: product.name,
            sku: product.sku,
            quantity: confirmQty,
            unit: product.unit,
            confirmDate: new Date().toISOString().split('T')[0],
            businessId: selectedOrder.businessId
        };
        setReadyInventory([newReadyItem, ...readyInventory]);

        // 3. Update Order Progress
        const updatedOrders = orders.map(o => {
            if (o.id === selectedOrder.id) {
                const newFin = (o.finishedQuantity || 0) + confirmQty;
                return {
                    ...o,
                    finishedQuantity: newFin,
                    status: newFin >= o.quantity ? 'COMPLETED' as const : o.status
                };
            }
            return o;
        });
        
        setOrders(updatedOrders);
        setItems(newItems);
        setIsConfirming(false);
        setSelectedOrder(null);
    };

    const handleDeleteReady = (id: string) => {
        if(confirm('Delete this shipment record? This will NOT restore used inventory.')) {
            const newList = readyInventory.filter(i => i.id !== id);
            setReadyInventory(newList);
            localStorage.setItem(getK('prod_ready_v1'), JSON.stringify(newList));
        }
    };

    if (!isLoaded) return <div className="p-12 text-center font-bold text-slate-400">Initialising Logistics...</div>;

    const pendingOrders = orders.filter(o => o.status !== 'COMPLETED');

    return (
        <div className="space-y-6 fade-in h-full flex flex-col pb-20 relative px-4 pt-4 bg-slate-50/30">
            
            {/* Header */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none group-hover:bg-sky-600/10 transition-all duration-700" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-sky-200 ring-4 ring-white">
                        <PackageCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Logistics & Shipments</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Ready-to-Ship Finished Inventory Ledger</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                     <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">{readyInventory.reduce((s,i) => s + i.quantity, 0)} Units in Stock</span>
                     </div>
                </div>
            </div>

            {/* Main Inventory Table */}
            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                <div className="px-8 py-5 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <Warehouse size={18} className="text-sky-500" />
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Warehouse Finished Goods Registry</h2>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {readyInventory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-20">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Package size={40} className="text-slate-200" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 text-center">
                                No shipping inventory found.<br/>Confirm final production steps to populate this registry.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50/80 backdrop-blur-md text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left">Confirmed Date</th>
                                    <th className="px-6 py-5 text-left">Article / SKU</th>
                                    <th className="px-6 py-5 text-left">Internal Source</th>
                                    <th className="px-6 py-5 text-right">Verified Qty</th>
                                    <th className="px-8 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {readyInventory.map((item, index) => (
                                    <tr key={`${item.id}-${index}`} className="hover:bg-sky-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-sky-100 group-hover:text-sky-600 transition-all">
                                                    <History size={14} />
                                                </div>
                                                <span className="text-xs font-black text-slate-700 font-mono italic tracking-tight">{item.confirmDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</span>
                                                <span className="text-[9px] font-black text-sky-500/70 uppercase tracking-widest mt-1">SKU: {item.sku || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Order: {item.orderId.substring(0,8)}</span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-lg font-black text-slate-900 tabular-nums">{item.quantity}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button 
                                                onClick={() => handleDeleteReady(item.id)}
                                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog Overlay */}
            {isConfirming && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-xl shadow-sky-200">
                                    <PackageCheck size={20} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Logistics Intake</h2>
                            </div>
                            <button onClick={() => setIsConfirming(false)} className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-200 transition">Close</button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            <div className="flex items-start gap-4 p-5 bg-sky-50 rounded-3xl border border-sky-100/50">
                                <AlertCircle className="text-sky-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-xs font-black text-sky-900 uppercase tracking-widest mb-1">Confirmation Rule</p>
                                    <p className="text-sm font-medium text-sky-700 leading-relaxed">This action will deduct required accessories and materials from your warehouse according to the Article's Bill of Materials (BOM) and finalize the finished good inventory.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Verified Yield Quantity</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            autoFocus
                                            value={confirmQty}
                                            onChange={e => setConfirmQty(Number(e.target.value))}
                                            className="w-full text-2xl font-black px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-sky-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Expected Out</p>
                                        <p className="text-lg font-black text-slate-800">{selectedOrder.quantity - (selectedOrder.finishedQuantity || 0)} Units</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <button onClick={() => setIsConfirming(false)} className="px-6 py-3 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition uppercase tracking-widest">Abort</button>
                            <button 
                                onClick={handleFinalConfirm}
                                className="px-12 py-4 bg-slate-900 hover:bg-sky-600 text-white rounded-3xl font-black text-sm shadow-2xl shadow-slate-200 transition-all active:scale-95 uppercase tracking-widest"
                            >
                                Confirm & Deduct Materials
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
