'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Package, Hash, Plus, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { logDailyProduction, deleteProductionLog } from '@/app/actions/production';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface AccessoryUsage { id: string; accessoryId: string; usageQuantity: number; }
interface ProcessRequirement { id: string; processName: string; unitsPerHour: number; sequence: number; }
interface ProductionItem { id: string; name: string; sku: string; type: 'MAIN' | 'ACCESSORY'; unit: string; stockQuantity: number; processes: ProcessRequirement[]; bom: AccessoryUsage[]; businessId?: string; }
interface ProductionOrder { id: string; mainPartId: string; quantity: number; priority: number; status: 'QUEUED' | 'IN_PRODUCTION' | 'COMPLETED'; finishedQuantity?: number; businessId?: string; }
interface ReadyToShipItem { id: string; orderId: string; name: string; sku: string; quantity: number; unit: string; confirmDate: string; businessId?: string; }

interface ProductionManagerClientProps {
    user: { id: string, name: string, role: string };
    todaysLogsData: any[]; // These come from DB
    businessId?: string;
}

export default function ProductionManagerClient({ user, todaysLogsData, businessId }: ProductionManagerClientProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState<ProductionItem[]>([]);
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [readyInventory, setReadyInventory] = useState<ReadyToShipItem[]>([]);
    const [todaysLogs, setTodaysLogs] = useState<any[]>(todaysLogsData);

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
            return results;
        };

        if (!businessId) {
            setItems(loadAggregated('prod_items_v3'));
            setOrders(loadAggregated('prod_ords_v2'));
            setReadyInventory(loadAggregated('prod_ready_v1'));
        } else {
            const i = localStorage.getItem(getK('prod_items_v3'));
            const o = localStorage.getItem(getK('prod_ords_v2'));
            const r = localStorage.getItem(getK('prod_ready_v1'));
            if (i) setItems(JSON.parse(i));
            if (o) setOrders(JSON.parse(o));
            if (r) setReadyInventory(JSON.parse(r));
        }
        setIsLoaded(true);
    }, [businessId]);

    const saveItems = (newItems: ProductionItem[]) => {
        setItems(newItems);
        localStorage.setItem(getK('prod_items_v3'), JSON.stringify(newItems));
    };
    const saveOrders = (newOrders: ProductionOrder[]) => {
        setOrders(newOrders);
        localStorage.setItem(getK('prod_ords_v2'), JSON.stringify(newOrders));
    };
    const saveReady = (newReady: ReadyToShipItem[]) => {
        setReadyInventory(newReady);
        localStorage.setItem(getK('prod_ready_v1'), JSON.stringify(newReady));
    };

    const mainArticles = items.filter(i => i.type === 'MAIN');
    const totalBoxes = todaysLogs.reduce((sum: number, l: any) => sum + (l.boxes || 0), 0);
    const totalYield = todaysLogs.reduce((sum: number, l: any) => sum + l.quantity, 0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        const articleId = fd.get('articleId') as string;
        const quantity = parseInt(fd.get('quantity') as string);
        const boxes = parseInt(fd.get('boxes') as string);

        const product = items.find(i => i.id === articleId);
        if (!product) {
            toast.error("Invalid product selected", { className: 'bg-rose-50 text-rose-600 border-rose-200 uppercase tracking-widest font-black text-[10px]' });
            setIsSubmitting(false);
            return;
        }

        // 1. Deduct BOM materials
        const newItems = [...items];
        let materialShortage = false;
        
        product.bom.forEach(bomItem => {
            const materialIdx = newItems.findIndex(i => i.id === bomItem.accessoryId);
            if (materialIdx !== -1) {
                const required = bomItem.usageQuantity * quantity;
                if (newItems[materialIdx].stockQuantity < required) {
                    materialShortage = true;
                }
                newItems[materialIdx] = {
                    ...newItems[materialIdx],
                    stockQuantity: Math.max(0, newItems[materialIdx].stockQuantity - required)
                };
            }
        });

        if (materialShortage && !confirm(`Warning: Some materials have insufficient stock for producing ${quantity} units of ${product.name}. Proceed anyway and set material stock to zero?`)) {
            setIsSubmitting(false);
            return;
        }

        // Find active order if any
        const activeOrder = orders.find(o => o.mainPartId === product.id && o.status !== 'COMPLETED');
        let orderId = activeOrder?.id || `anon_ord_${Math.random().toString(36).substring(2, 9)}`;

        // 2. Add to Ready to Ship
        const newReadyItem: ReadyToShipItem = {
            id: Math.random().toString(36).substring(2, 9),
            orderId: orderId,
            name: product.name,
            sku: product.sku,
            quantity: quantity,
            unit: product.unit,
            confirmDate: new Date().toISOString().split('T')[0],
            businessId: businessId || product.businessId
        };
        const newReadyInventory = [newReadyItem, ...readyInventory];

        // 3. Update Order Progress IF an order exists
        let updatedOrders = [...orders];
        if (activeOrder) {
            updatedOrders = orders.map(o => {
                if (o.id === activeOrder.id) {
                    const newFin = (o.finishedQuantity || 0) + quantity;
                    return {
                        ...o,
                        finishedQuantity: newFin,
                        status: newFin >= o.quantity ? 'COMPLETED' : o.status
                    };
                }
                return o;
            });
        }

        // Apply LocalStorage State updates
        saveItems(newItems);
        saveReady(newReadyInventory);
        saveOrders(updatedOrders);

        // 4. Submit specifically to the Production Ledger (PostgreSQL) for Admin review.
        try {
            await logDailyProduction({
                businessId,
                workerId: user.id || '',
                articleId: product.id,
                articleName: product.name,
                sku: product.sku || undefined,
                quantity: quantity,
                boxes: boxes,
            });
            toast.success(`Production Logged Successfully: ${quantity} units of ${product.name}`);
            
            // Re-update local logs visually
            setTodaysLogs([{ id: Date.now().toString(), articleName: product.name, boxes, quantity, createdAt: new Date() }, ...todaysLogs]);
            
            (e.target as HTMLFormElement).reset();
        } catch (err) {
            toast.error("Failed to commit log to PostgreSQL, but local inventory was deducted.");
        }

        setIsSubmitting(false);
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm("Are you sure you want to delete this log entry? This will permanently remove it from the system ledger.")) return;
        const res = await deleteProductionLog(id);
        if (res.success) {
            setTodaysLogs(todaysLogs.filter(l => l.id !== id));
            toast.success("Log entry removed");
        } else {
            toast.error("Failed to delete log");
        }
    };

    if (!isLoaded) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Inventory Matrix...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none group-hover:bg-indigo-600/10 transition-all duration-700" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 ring-4 ring-white">
                            <Cpu size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Shift</h1>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {format(new Date(), 'EEEE, MMMM do yyyy')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 border-l border-slate-100 pl-6">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Boxes Today</div>
                            <div className="text-2xl font-black text-slate-900">{totalBoxes.toLocaleString()}</div>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Yield Today</div>
                            <div className="text-2xl font-black text-slate-900 tabular-nums">{totalYield.toLocaleString()} <span className="text-[10px]">pcs</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 text-lg">Log Finished Goods</h2>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Submit Pallet & Box Counts</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Target Article</label>
                                <span className="text-[10px] font-bold text-slate-400 italic">Auto-reflects from Prod Planner</span>
                            </div>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select 
                                    name="articleId"
                                    required 
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-slate-400">SELECT PRODUCTION ARTICLE...</option>
                                    {mainArticles.map((a: any) => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.sku})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Total Boxes</label>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="number" 
                                        name="boxes" 
                                        required 
                                        min="1"
                                        placeholder="0"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg tabular-nums focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Piece Count</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="number" 
                                        name="quantity" 
                                        required 
                                        min="1"
                                        placeholder="0"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg tabular-nums focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all" 
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 mt-6"
                        >
                            {isSubmitting ? 'PROCESSING LEDGER...' : 'SUBMIT SHIFT DATA'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex align-center justify-between">
                        <h2 className="text-[11px] font-black tracking-widest uppercase text-slate-500">Today's Ledger History</h2>
                    </div>
                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {todaysLogs.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Package className="text-slate-300" size={24} />
                                </div>
                                <div className="text-[11px] font-black tracking-widest text-slate-400 uppercase leading-loose">No entries recorded<br/>for this shift yet.</div>
                            </div>
                        ) : (
                            todaysLogs.map((log: any) => (
                                <div key={log.id} className="p-6 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                                    <div>
                                        <div className="font-bold text-sm text-slate-900">{log.articleName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Logged at {format(new Date(log.createdAt), 'HH:mm')}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <div className="text-xs font-black text-slate-700">{log.boxes} Bx</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-black tubular-nums">
                                            {log.quantity}
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteLog(log.id)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
