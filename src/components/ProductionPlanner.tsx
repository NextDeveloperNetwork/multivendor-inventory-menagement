'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Clock, ChevronLeft, ChevronRight, Plus, X,
    Box, Users, Target, BarChart3, Activity, Calendar, Timer,
    AlertCircle, ArrowRight, RefreshCw, Lock, AlertTriangle, ClipboardList
} from 'lucide-react';
import { logProduction } from '@/app/actions/production';

/* ─── INTERFACES ─── */
interface AccessoryUsage { id: string; accessoryId: string; usageQuantity: number; processName?: string; }
interface ProcessRequirement { id: string; processName: string; unitsPerHour: number; sequence: number; }
interface ProductionItem { id: string; name: string; type: 'MAIN' | 'ACCESSORY'; unit: string; stockQuantity: number; processes: ProcessRequirement[]; bom: AccessoryUsage[]; businessId?: string; businessName?: string; }
interface Employee { id: string; name: string; skills: string[]; availableHours: number; businessId?: string; businessName?: string; }
interface Machine { id: string; name: string; capableProcesses: string[]; businessId?: string; businessName?: string; }
interface GlobalProcess { id: string; name: string; requiresMachine: boolean; businessId?: string; businessName?: string; }
interface ProductionOrder { id: string; mainPartId: string; quantity: number; priority: number; status: 'QUEUED' | 'IN_PRODUCTION' | 'COMPLETED'; finishedQuantity?: number; businessId?: string; businessName?: string; }

/* ─── SIM TYPES ─── */
interface MinuteSlot { orderId: string; businessId?: string; partName: string; procName: string; sequence: number; worker: string; workerId: string; machine: string; units: number; minuteStart: number; minuteEnd: number; }
interface HourSlot { hour: number; slots: MinuteSlot[]; }
type OrderColor = { bg: string; light: string; text: string; border: string };
interface ArticleSummaryItem {
    orderId: string;
    businessId?: string;
    partName: string;
    color: OrderColor;
    totalUnits: number;
    byProcess: {
        procName: string;
        sequence: number;
        units: number;
        assignments: { worker: string; machine: string; skills: string[] }[];
    }[];
}
interface DayPlan {
    day: number;
    date: Date;
    articlesSummary: ArticleSummaryItem[];
    hours: HourSlot[];
    unusedPersonnel: { name: string; skills: string[] }[];
    unusedMachinery: string[];
}
interface SimResult { days: DayPlan[]; orderTimelines: Record<string, { firstDay: number; lastDay: number; partName: string; totalFinished: number; bottleneck?: string }>; }

/* ─── COLOURS ─── */
const COLORS: OrderColor[] = [
    { bg: '#6366f1', light: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    { bg: '#0ea5e9', light: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
    { bg: '#10b981', light: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    { bg: '#f59e0b', light: '#fffbeb', text: '#b45309', border: '#fde68a' },
    { bg: '#ef4444', light: '#fff1f2', text: '#b91c1c', border: '#fecaca' },
    { bg: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
    { bg: '#ec4899', light: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
    { bg: '#14b8a6', light: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
];
const gid = () => Math.random().toString(36).substring(2, 9);
const fh = (h: number) => `${String(h).padStart(2, '0')}:00`;

/* ═══════════ MAIN COMPONENT ═══════════ */
export default function ProductionPlanner({ businessId }: { businessId?: string }) {
    const getK = (k: string) => businessId ? `${k}_${businessId}` : k;

    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState<ProductionItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [globalProcesses, setGlobalProcesses] = useState<GlobalProcess[]>([]);
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    type ViewMode = 'DAILY' | 'HOURLY' | 'MINUTE';
    const [viewMode, setViewMode] = useState<ViewMode>('DAILY');
    const [inventory, setInventory] = useState<{ id: string, orderId: string, name: string, quantity: number, confirmDate: string, businessId?: string }[]>([]);
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [windowOffset, setWindowOffset] = useState(0);
    const [activeHourIdx, setActiveHourIdx] = useState(0);
    const [selPartId, setSelPartId] = useState('');
    const [qty, setQty] = useState('100');
    const [contextOrder, setContextOrder] = useState<string | null>(null);
    const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);
    const [planStartDate, setPlanStartDate] = useState<string>('');
    const [actuals, setActuals] = useState<{ orderId: string, dayIdx: number, procName: string, workerId: string, units: number, businessId?: string }[]>([]);
    const [showingInsight, setShowingInsight] = useState<{ title: string; explanation: string; icon: React.ReactNode } | null>(null);

    useEffect(() => {
        const loadAggregated = (baseKey: string) => {
            const results: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k === baseKey || k.startsWith(`${baseKey}_`))) {
                    const bid = k.includes('_') ? k.split('_').pop() : '';
                    const data = JSON.parse(localStorage.getItem(k) || '[]');
                    results.push(...data.map((item: any) => ({ ...item, businessId: bid })));
                }
            }
            return results;
        };

        if (!businessId) {
            // Global Aggregate Mode
            setItems(loadAggregated('prod_items_v3'));
            setEmployees(loadAggregated('prod_emps_v2'));
            setMachines(loadAggregated('prod_macs_v2'));
            setGlobalProcesses(loadAggregated('prod_procs_v2'));
            setOrders(loadAggregated('prod_ords_v2'));
            setInventory(loadAggregated('prod_ready_v1'));
        } else {
            // Specific Business Mode
            const d = (k: string) => { const v = localStorage.getItem(getK(k)); return v ? JSON.parse(v) : null; };
            const it = d('prod_items_v3'); setItems(it || []);
            const em = d('prod_emps_v2'); setEmployees(em || []);
            const ma = d('prod_macs_v2'); setMachines(ma || []);
            const pr = d('prod_procs_v2'); setGlobalProcesses(pr || []);
            const or = d('prod_ords_v2'); setOrders(or || []);
            const ac = d('prod_actuals_v1'); setActuals(ac || []);
            const inv = d('prod_ready_v1'); setInventory(inv || []);
            const st = localStorage.getItem(getK('prod_plan_start'));
            if (st) setPlanStartDate(st); else { const n = new Date().toISOString().split('T')[0]; setPlanStartDate(n); localStorage.setItem(getK('prod_plan_start'), n); }
        }
        setIsLoaded(true);
    }, [businessId]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(getK('prod_ords_v2'), JSON.stringify(orders));
        localStorage.setItem(getK('prod_items_v3'), JSON.stringify(items));
        localStorage.setItem(getK('prod_actuals_v1'), JSON.stringify(actuals));
        localStorage.setItem(getK('prod_ready_v1'), JSON.stringify(inventory));
    }, [orders, items, actuals, inventory, isLoaded, businessId]);

    const dates = useMemo(() => {
        const base = planStartDate ? new Date(planStartDate) : new Date();
        return Array.from({ length: 60 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
    }, [planStartDate]);

    /* ─── SIMULATION ENGINE ─── */
    const simulation = useMemo((): SimResult => {
        if (!isLoaded || orders.length === 0) return { days: [], orderTimelines: {} };
        const HOURS = 8;
        const colorMap: Record<string, OrderColor> = {};
        [...orders].sort((a, b) => a.priority - b.priority).forEach((o, i) => { colorMap[o.id] = COLORS[i % COLORS.length]; });
        const stocks = items.map(i => ({ ...i }));
        const timelines: Record<string, { firstDay: number; lastDay: number; partName: string; totalFinished: number; bottleneck?: string }> = {};
        const days: DayPlan[] = [];

        const now = new Date();
        const start = planStartDate ? new Date(planStartDate) : new Date();
        const currentDayIdx = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        // Pre-calculate historical totals up TO the day we start simulating
        const historyUpTo = (cutoffDay: number) => {
            const h: Record<string, Record<string, number>> = {};
            actuals.forEach(a => {
                if (a.dayIdx < cutoffDay) {
                    if (!h[a.orderId]) h[a.orderId] = {};
                    h[a.orderId][a.procName] = (h[a.orderId][a.procName] || 0) + a.units;
                }
            });
            return h;
        };

        const initialHistory = historyUpTo(currentDayIdx);

        const state = orders.map(o => {
            const prod = items.find(i => i.id === o.mainPartId);
            const firstProcName = prod?.processes.sort((a, b) => a.sequence - b.sequence)[0]?.processName;
            const wip: Record<number, number> = {};

            // Collect ALL actuals for this order, including today's entries
            const orderActuals: Record<string, number> = {};
            actuals.forEach(a => {
                if (a.orderId === o.id) {
                    orderActuals[a.procName] = (orderActuals[a.procName] || 0) + a.units;
                }
            });

            prod?.processes.forEach(p => {
                wip[p.sequence] = orderActuals[p.processName] || 0;
            });

            return {
                id: o.id,
                businessId: o.businessId,
                priority: o.priority,
                mainPartId: o.mainPartId,
                remaining: Math.max(0, o.quantity - (orderActuals[firstProcName || ''] || 0)),
                wip,
                stepStarts: {} as Record<number, number>
            };
        });

        for (let day = 0; day < 60; day++) {
            if (day < currentDayIdx) {
                // Build a historical articlesSummary from 'actuals' for this day
                const dayActuals = actuals.filter(a => a.dayIdx === day);
                const dailySum: Record<string, ArticleSummaryItem> = {};

                dayActuals.forEach(a => {
                    const c = colorMap[a.orderId] || COLORS[0];
                    if (!dailySum[a.orderId]) {
                        dailySum[a.orderId] = {
                            orderId: a.orderId,
                            partName: items.find(it => it.id === orders.find(o => o.id === a.orderId)?.mainPartId)?.name || '?',
                            color: c,
                            totalUnits: 0,
                            byProcess: []
                        };
                    }
                    dailySum[a.orderId].totalUnits += a.units;
                    let p = dailySum[a.orderId].byProcess.find(bp => bp.procName === a.procName);
                    if (!p) {
                        p = { procName: a.procName, sequence: items.find(it => it.id === orders.find(o => o.id === a.orderId)?.mainPartId)?.processes.find(pr => pr.processName === a.procName)?.sequence || 0, units: 0, assignments: [] };
                        dailySum[a.orderId].byProcess.push(p);
                    }
                    p.units += a.units;
                    p.assignments.push({ worker: employees.find(e => e.id === a.workerId)?.name || '?', machine: 'Manual', skills: [] });
                });

                days.push({ day, date: dates[day], articlesSummary: Object.values(dailySum), hours: [], unusedPersonnel: [], unusedMachinery: [] });
                continue;
            }
            const empBusy: Record<string, Set<number>> = {};
            employees.forEach(e => { empBusy[e.id] = new Set(); });
            const macBusy: Record<string, Set<number>> = {};
            machines.forEach(m => { macBusy[m.id] = new Set(); });
            const hourSlots: HourSlot[] = Array.from({ length: HOURS }, (_, h) => ({ hour: h, slots: [] }));
            const sumMap: Record<string, {
                orderId: string;
                partName: string;
                businessId?: string;
                color: OrderColor;
                totalUnits: number;
                byProcess: Record<string, {
                    sequence: number;
                    units: number;
                    assignments: Set<string>; // Combined worker+machine+skills string
                }>;
            }> = {};

            // ── HOUR-FIRST LOOP ─────────────────────────────────────────────────────
            // Snapshot node.wip at the START of each hour. Downstream processes
            // (seq > 1) can ONLY consume units present in that snapshot, so
            // process N+1 can never start until process N has produced WIP in
            // a *previous* hour — enforcing the real sequential constraint.
            for (let h = 0; h < HOURS; h++) {
                const minStart = h * 60;
                const minEnd = (h + 1) * 60;
                const wipSnap: Record<string, Record<number, number>> = {};
                for (const node of state) { wipSnap[node.id] = { ...node.wip }; }

                for (const node of [...state].sort((a, b) => a.priority - b.priority)) {
                    const product = items.find(i => i.id === node.mainPartId);
                    if (!product) continue;
                    const procs = [...product.processes].sort((a, b) => a.sequence - b.sequence);

                    for (let pi = 0; pi < procs.length; pi++) {
                        const proc = procs[pi];
                        const isFirst = pi === 0;
                        const prevSeq = isFirst ? null : procs[pi - 1].sequence;
                        let unitsReady: number;

                        // ── ACCESSORY & STOCK GATING ────────────────────────────────────────
                        // Determine which accessories are required for THIS specific process.
                        // If an accessory has NO linked processName, it's assumed to be 
                        // required at the very first step.
                        const stepBom = product.bom.filter(b =>
                            b.processName === proc.processName || (isFirst && !b.processName)
                        );

                        if (isFirst) {
                            if (node.remaining <= 0) continue;
                            unitsReady = node.remaining;

                            // Only cap by the available BOM accessories, NOT the finished good's own stock.
                            let cap = Infinity;
                            stepBom.forEach(b => {
                                const a = stocks.find(s => s.id === b.accessoryId);
                                cap = Math.min(cap, Math.floor((a?.stockQuantity ?? 0) / b.usageQuantity));
                            });
                            unitsReady = Math.min(unitsReady, cap);
                        } else {
                            // Use snapshot: process N+1 cannot start until process N
                            // produced units in a PREVIOUS hour (not the current one).
                            const prevAvail = prevSeq !== null ? (wipSnap[node.id][prevSeq] ?? 0) : 0;
                            unitsReady = prevAvail - (node.wip[proc.sequence] ?? 0);

                            // Check accessories for this specific non-first step
                            let cap = Infinity;
                            stepBom.forEach(b => {
                                const a = stocks.find(s => s.id === b.accessoryId);
                                cap = Math.min(cap, Math.floor((a?.stockQuantity ?? 0) / b.usageQuantity));
                            });
                            unitsReady = Math.min(unitsReady, cap);

                            // ── 1-HOUR LAG CONSTRAINT ────────────────────────────────────────
                            // Process N+1 must wait at least 1 hour after Process N started.
                            const globalHour = (day * HOURS) + h;
                            const prevStart = prevSeq !== null ? node.stepStarts[prevSeq] : undefined;
                            if (prevStart !== undefined && globalHour < prevStart + 1) {
                                unitsReady = 0;
                            }
                        }
                        if (unitsReady <= 0) continue;

                        const qualEmp = employees
                            .filter(e => e.skills.includes(proc.processName))
                            .sort((a, b) => a.skills.length - b.skills.length); // Prioritize specialists
                        const needsMac = globalProcesses.find(gp => gp.name === proc.processName)?.requiresMachine ?? false;
                        const qualMac = needsMac
                            ? machines.filter(m => m.capableProcesses.includes(proc.processName)).sort((a, b) => a.capableProcesses.length - b.capableProcesses.length)
                            : [];
                        // ── INTELLIGENT MULTI-RESOURCE ALLOCATION ─────────────────────────────
                        // Each minute, allocate ALL free qualified employees (and machines)
                        // simultaneously. This maximises throughput: 3 skilled workers = 3×
                        // output rate. Priority order ensures higher-priority orders grab
                        // resources first; leftovers go to lower-priority orders.
                        let unitsLeft = unitsReady;
                        for (let min = minStart; min < minEnd && unitsLeft > 0; min++) {
                            for (const emp of qualEmp) {
                                if (unitsLeft <= 0) break;
                                if (empBusy[emp.id].has(min)) continue;
                                let mac: Machine | undefined;
                                if (needsMac) { mac = qualMac.find(m => !macBusy[m.id].has(min)); if (!mac) continue; }
                                empBusy[emp.id].add(min);
                                if (mac) macBusy[mac.id].add(min);
                                const u = Math.min(proc.unitsPerHour / 60, unitsLeft);
                                unitsLeft -= u;
                                const slot: MinuteSlot = { orderId: node.id, partName: product.name, procName: proc.processName, sequence: proc.sequence, worker: emp.name, workerId: emp.id, machine: mac?.name ?? 'Manual', units: u, minuteStart: min % 60, minuteEnd: (min % 60) + 1 };
                                hourSlots[h].slots.push(slot);
                                if (!sumMap[node.id]) sumMap[node.id] = { orderId: node.id, businessId: node.businessId, partName: product.name, color: colorMap[node.id], totalUnits: 0, byProcess: {} };
                                sumMap[node.id].totalUnits += u;
                                if (!sumMap[node.id].byProcess[proc.processName]) {
                                    sumMap[node.id].byProcess[proc.processName] = { sequence: proc.sequence, units: 0, assignments: new Set() };
                                }
                                sumMap[node.id].byProcess[proc.processName].units += u;
                                sumMap[node.id].byProcess[proc.processName].assignments.add(`${emp.name} | ${mac?.name ?? 'Manual'} | ${emp.skills.join(',')}`);
                            }
                        }
                        const done = unitsReady - unitsLeft;
                        node.wip[proc.sequence] = (node.wip[proc.sequence] ?? 0) + done;
                        if (done > 0 && node.stepStarts[proc.sequence] === undefined) {
                            node.stepStarts[proc.sequence] = (day * HOURS) + h;
                        }
                        if (done > 0) {
                            // Deduct stock for accessories used in THIS process
                            stepBom.forEach(bm => {
                                const a = stocks.find(s => s.id === bm.accessoryId);
                                if (a) a.stockQuantity = Math.max(0, a.stockQuantity - done * bm.usageQuantity);
                            });

                            if (isFirst) {
                                const used = Math.min(done, node.remaining);
                                node.remaining -= used;
                            }
                        }
                        if (done > 0) {
                            if (!timelines[node.id]) timelines[node.id] = { firstDay: day, lastDay: day, partName: product.name, totalFinished: 0 };
                            timelines[node.id].lastDay = day;
                            const isLast = pi === procs.length - 1;
                            if (isLast) timelines[node.id].totalFinished += done;
                        }
                    }
                }
            } // end hour loop

            if (day < currentDayIdx) {
                // HISTORICAL ACTUALS OVERRIDE
                const hisSumMap: Record<string, any> = {};
                const hisHourSlots: HourSlot[] = Array.from({ length: HOURS }, (_, h) => ({ hour: h, slots: [] }));

                actuals.filter(a => a.dayIdx === day).forEach(a => {
                    const order = orders.find(o => o.id === a.orderId);
                    const prod = items.find(it => it.id === order?.mainPartId);
                    if (!order || !prod) return;
                    if (!hisSumMap[a.orderId]) hisSumMap[a.orderId] = { orderId: a.orderId, businessId: a.businessId, partName: prod.name, color: colorMap[a.orderId], totalUnits: 0, byProcess: {} };
                    const proc = prod.processes.find(p => p.processName === a.procName);
                    if (!proc) return;
                    hisSumMap[a.orderId].totalUnits += a.units;
                    if (!hisSumMap[a.orderId].byProcess[a.procName]) hisSumMap[a.orderId].byProcess[a.procName] = { sequence: proc.sequence, units: 0, assignments: new Set() };
                    hisSumMap[a.orderId].byProcess[a.procName].units += a.units;
                    hisHourSlots[0].slots.push({ orderId: a.orderId, partName: prod.name, procName: a.procName, sequence: proc.sequence, worker: 'Confirmed Output', workerId: 'confirm', machine: 'Stock', units: a.units, minuteStart: 0, minuteEnd: 60 });
                });

                days.push({
                    day,
                    date: dates[day],
                    articlesSummary: Object.values(hisSumMap).map(item => ({
                        ...item,
                        byProcess: Object.entries(item.byProcess).map(([pn, d]: [string, any]) => ({ procName: pn, sequence: d.sequence, units: d.units, assignments: [] })).sort((a, b) => a.sequence - b.sequence)
                    })),
                    hours: hisHourSlots,
                    unusedPersonnel: [],
                    unusedMachinery: []
                });
            } else {
                const articlesSummary: ArticleSummaryItem[] = Object.values(sumMap).map(item => ({
                    orderId: item.orderId,
                    businessId: item.businessId,
                    partName: item.partName,
                    color: item.color,
                    totalUnits: item.totalUnits,
                    byProcess: Object.entries(item.byProcess).map(([pn, d]) => ({
                        procName: pn,
                        sequence: d.sequence,
                        units: d.units,
                        assignments: Array.from(d.assignments).map(s => {
                            const [w, m, sk] = s.split(' | ');
                            return { worker: w, machine: m, skills: sk ? sk.split(',') : [] };
                        })
                    })).sort((a, b) => a.sequence - b.sequence)
                }));

                const unusedPersonnel = employees.filter(e => empBusy[e.id].size === 0).map(e => ({ name: e.name, skills: e.skills }));
                const unusedMachinery = machines.filter(m => macBusy[m.id].size === 0).map(m => m.name);

                days.push({ day, date: dates[day], articlesSummary, hours: hourSlots, unusedPersonnel, unusedMachinery });
            }
        }

        /* ── BOTTLENECK ANALYSIS ── */
        state.forEach(node => {
            const tl = timelines[node.id];
            const o = orders.find(x => x.id === node.id);
            if (!o) return;
            const product = items.find(i => i.id === node.mainPartId);
            if (!product) return;

            // If it never started, or started but didn't finish its quantity, it is bottlenecked.
            if (!tl || tl.totalFinished < o.quantity) {
                let reason = 'Capacity Limit (60 Days)';

                // Check raw material limit
                let rawShortage = false;
                for (const b of product.bom) {
                    const a = stocks.find(s => s.id === b.accessoryId);
                    // A crude check: if we need materials for ANY step, did we run out?
                    // Because simulation deducts as it goes, the local `stocks` array holds final values.
                    if (!a || a.stockQuantity < b.usageQuantity) {
                        rawShortage = true;
                        break;
                    }
                }

                if (rawShortage) {
                    reason = 'Raw Materials Depleted';
                } else {
                    let missingSkill = false;
                    for (const p of product.processes) {
                        if (!employees.some(e => e.skills.includes(p.processName))) missingSkill = true;
                    }
                    if (missingSkill) {
                        reason = 'Missing Skilled Labor';
                    } else {
                        let missingMac = false;
                        for (const p of product.processes) {
                            const gp = globalProcesses.find(x => x.name === p.processName);
                            if (gp?.requiresMachine && !machines.some(m => m.capableProcesses.includes(p.processName))) {
                                missingMac = true;
                            }
                        }
                        if (missingMac) reason = 'Missing Machinery';
                    }
                }

                if (!tl) {
                    timelines[node.id] = { firstDay: 0, lastDay: 0, partName: product.name, totalFinished: 0, bottleneck: reason };
                } else {
                    tl.bottleneck = reason;
                }
            }
        });

        return { days, orderTimelines: timelines };
    }, [orders, items, employees, machines, globalProcesses, isLoaded, dates, actuals, planStartDate]);

    const autoPopulate = () => {
        const mains = items.filter(i => i.type === 'MAIN' && i.processes.length > 0);
        const existing = new Set(orders.map(o => o.mainPartId));
        const news: ProductionOrder[] = mains.filter(i => !existing.has(i.id)).map((item, idx) => ({ id: gid(), mainPartId: item.id, quantity: Math.max(item.stockQuantity, 50), priority: orders.length + idx + 1, status: 'QUEUED' as const, finishedQuantity: 0 }));
        if (news.length === 0) return;
        const updated = [...orders, ...news];
        setOrders(updated);
        localStorage.setItem(getK('prod_ords_v2'), JSON.stringify(updated));
    };

    const empColorMap = useMemo(() => {
        const c = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const m: Record<string, string> = {};
        employees.forEach((e, i) => { m[e.id] = c[i % c.length]; });
        return m;
    }, [employees]);

    const orderColorMap = useMemo(() => {
        const m: Record<string, OrderColor> = {};
        [...orders].sort((a, b) => a.priority - b.priority).forEach((o, i) => { m[o.id] = COLORS[i % COLORS.length]; });
        return m;
    }, [orders]);

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const handleOpenContext = (e: React.MouseEvent, orderId: string) => {
        e.preventDefault();
        setContextOrder(orderId);
        setContextPos({ x: e.clientX, y: e.clientY });
    };

    const updateOrder = (id: string, updates: Partial<ProductionOrder>) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    if (!isLoaded) return <div className="h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    const activeDay = simulation.days[activeDayIdx];
    const activeHour = activeDay?.hours[activeHourIdx];

    return (
        <div className="flex flex-col h-screen bg-slate-100 text-slate-900 -m-6 overflow-hidden select-none">
            {/* HEADER */}
            <header className="h-11 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-50 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center"><LayoutDashboard size={13} className="text-white" /></div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">Production Control</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-2">
                        {(['DAILY', 'HOURLY', 'MINUTE'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
                                {m === 'DAILY' ? <Calendar size={10} /> : m === 'HOURLY' ? <Clock size={10} /> : <Timer size={10} />}{m}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={autoPopulate} className="h-7 px-2.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 text-emerald-700 transition-colors">
                        <RefreshCw size={10} />Auto-Populate
                    </button>
                    <div className="h-5 w-px bg-slate-200" />
                    <select value={selPartId} onChange={e => setSelPartId(e.target.value)} className="h-7 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold px-2 focus:ring-0 focus:outline-none min-w-[110px]">
                        <option value="">Select Article…</option>
                        {items.filter(i => i.type === 'MAIN').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-14 h-7 bg-slate-50 border border-slate-200 rounded text-center font-black text-[10px] focus:ring-0 focus:outline-none" />
                    <button onClick={() => { if (!selPartId) return; setOrders(prev => [...prev, { id: gid(), mainPartId: selPartId, quantity: Number(qty), priority: prev.length + 1, status: 'QUEUED', finishedQuantity: 0 }]); }} className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 transition-colors">
                        <Plus size={11} />Queue
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 flex items-center justify-between">
                        <span>Orders</span><span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md">{orders.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {orders.length === 0 && <div className="p-4 text-center text-slate-400 text-xs font-bold">No orders queued</div>}
                        {/* Clicking an order card filters the hourly view to show only that article */}
                        {[...orders].sort((a, b) => a.priority - b.priority).map((o, idx) => {
                            const c = COLORS[idx % COLORS.length];
                            const part = items.find(i => i.id === o.mainPartId);
                            const tl = simulation.orderTimelines[o.id];
                            const pct = tl ? Math.min(100, Math.round((tl.totalFinished / o.quantity) * 100)) : 0;
                            const isSelected = selectedOrderId === o.id;
                            return (
                                <div key={o.id}
                                    onClick={() => setSelectedOrderId(isSelected ? null : o.id)}
                                    onContextMenu={(e) => handleOpenContext(e, o.id)}
                                    className={`rounded-lg border overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-1 ring-indigo-500 shadow-sm z-10 relative' : 'opacity-85 hover:opacity-100'}`}
                                    style={{ borderColor: c.border, backgroundColor: c.light }}>
                                    <div className="relative overflow-hidden pt-0.5">
                                        {/* Background Progress Bar */}
                                        <div className="absolute top-0 bottom-0 left-0 transition-all duration-500 opacity-20" style={{ width: `${pct}%`, backgroundColor: c.bg }} />

                                        <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 relative z-10 w-full">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.bg }} />
                                                <div className="text-[11px] font-black uppercase truncate" style={{ color: c.text }}>{part?.name ?? '?'}</div>
                                            </div>
                                            <div className="whitespace-nowrap flex items-baseline gap-1 shrink-0">
                                                <span className="text-xs font-black tabular-nums" style={{ color: c.text }}>{o.quantity}</span>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase">{part?.unit}</span>
                                            </div>
                                        </div>

                                        {tl?.bottleneck && (
                                            <div className="px-2 pb-1.5 relative z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        let explanation = "";
                                                        if (tl.bottleneck === 'Capacity Limit (60 Days)') {
                                                            explanation = "The current workforce and machinery cannot finish this order within our 60-day planning horizon. You may need to hire more staff or add more machines to speed up production.";
                                                        } else if (tl.bottleneck === 'Raw Materials Depleted') {
                                                            explanation = "Production has halted because the required accessories in your warehouse (defined in the Article's BOM) have run out. Restock your materials to continue.";
                                                        } else if (tl.bottleneck === 'Missing Skilled Labor') {
                                                            explanation = "None of your current staff have the specific skills required for one or more process steps of this article.";
                                                        } else if (tl.bottleneck === 'Missing Machinery') {
                                                            explanation = "Your factory is missing the specific machines required for this article's automated process steps.";
                                                        }
                                                        setShowingInsight({ title: tl.bottleneck || 'Production Insight', explanation, icon: <AlertTriangle className="text-rose-500" /> });
                                                    }}
                                                    className="w-full text-[7px] font-bold text-rose-600 bg-rose-50/90 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1 uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-colors text-left"
                                                >
                                                    <AlertTriangle size={8} className="shrink-0" /> <span className="truncate flex-1">{tl.bottleneck}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* DAY RIBBON */}
                    <nav className="h-8 shrink-0 border-b border-slate-200 bg-white flex items-center px-2 gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5 pl-2"><Calendar size={12} /> Days</span>

                        <button
                            onClick={() => setWindowOffset(Math.max(0, windowOffset - 10))}
                            disabled={windowOffset === 0}
                            className="p-1 px-2 text-slate-300 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        ><ChevronLeft size={14} /></button>

                        <div className="flex-1 flex overflow-hidden gap-px justify-between" style={{ scrollbarWidth: 'none' }}>
                            {dates.slice(windowOffset, windowOffset + 40).map((d, vi) => {
                                const i = windowOffset + vi;
                                const hasWork = (simulation.days[i]?.articlesSummary.length ?? 0) > 0;
                                return (
                                    <button key={i} onClick={() => setActiveDayIdx(i)} className={`flex-1 min-w-0 px-1 py-0.5 rounded text-[8px] font-black uppercase transition-all relative ${activeDayIdx === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
                                        <span className="truncate block">{d.getDate()}/{d.getMonth() + 1}</span>
                                        {hasWork && activeDayIdx !== i && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setWindowOffset(Math.min(20, windowOffset + 10))}
                            disabled={windowOffset === 20}
                            className="p-1 px-2 text-slate-300 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        ><ChevronRight size={14} /></button>
                    </nav>

                    <div className="flex-1 overflow-auto p-3 space-y-3">
                        {viewMode === 'DAILY' && <DailyView days={simulation.days} orderTimelines={simulation.orderTimelines} orders={orders} items={items} activeDayIdx={activeDayIdx} setActiveDayIdx={setActiveDayIdx} orderColorMap={orderColorMap} onDrillHourly={() => setViewMode('HOURLY')} setSelectedOrderId={setSelectedOrderId} windowOffset={windowOffset} setWindowOffset={setWindowOffset} setActuals={setActuals} setOrders={setOrders} gid={gid} />}
                        {viewMode === 'HOURLY' && <HourlyView day={activeDay} dayIdx={activeDayIdx} activeHourIdx={activeHourIdx} setActiveHourIdx={h => { setActiveHourIdx(h); setViewMode('MINUTE'); }} empColorMap={empColorMap} orderColorMap={orderColorMap} selectedOrderId={selectedOrderId} setSelectedOrderId={setSelectedOrderId} orders={orders} items={items} />}
                        {viewMode === 'MINUTE' && (
                            <MinuteView
                                day={activeDay}
                                hourIdx={activeHourIdx}
                                dayIdx={activeDayIdx}
                                empColorMap={empColorMap}
                                orderColorMap={orderColorMap}
                                onBack={() => setViewMode('HOURLY')}
                                onHourChange={setActiveHourIdx}
                                selectedOrderId={selectedOrderId}
                                orders={orders}
                                items={items}
                                employees={employees}
                                actuals={actuals}
                                setActuals={setActuals}
                                setOrders={setOrders}
                                setItems={setItems}
                                inventory={inventory}
                                setInventory={setInventory}
                                gid={gid}
                                planStartDate={planStartDate}
                            />
                        )}
                    </div>
                </main>
            </div>

            {contextOrder && contextPos && (
                <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => { setContextOrder(null); setContextPos(null); }}
                    onContextMenu={(e) => { e.preventDefault(); setContextOrder(null); setContextPos(null); }}
                >
                    <div
                        className="absolute bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-52 space-y-4 animate-in fade-in zoom-in duration-150"
                        style={{ top: Math.min(contextPos?.y ?? 0, window.innerHeight - 200), left: Math.min(contextPos?.x ?? 0, window.innerWidth - 220) }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Edit</span>
                            <button onClick={() => setContextOrder(null)} className="text-slate-300 hover:text-slate-600"><X size={14} /></button>
                        </div>

                        {(() => {
                            const o = orders.find(x => x.id === contextOrder);
                            if (!o) return null;
                            return (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Target size={10} /> Priority Rank</label>
                                        <input
                                            type="number"
                                            value={o.priority}
                                            onChange={e => updateOrder(o.id, { priority: Number(e.target.value) })}
                                            className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black px-3 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Activity size={10} /> Finished Units (WIP)</label>
                                        <input
                                            type="number"
                                            value={o.finishedQuantity || 0}
                                            onChange={e => updateOrder(o.id, { finishedQuantity: Number(e.target.value) })}
                                            className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black px-3 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-slate-50">
                                        <button
                                            onClick={() => { setOrders(prev => prev.filter(x => x.id !== o.id)); setContextOrder(null); }}
                                            className="w-full h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                                        >
                                            Cancel Order
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
            {showingInsight && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
                                {showingInsight.icon}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{showingInsight.title}</h2>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">{showingInsight.explanation}</p>
                            </div>
                            <button
                                onClick={() => setShowingInsight(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                            >
                                Understood, I'll Fix It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════
   DAILY VIEW
   - Gantt chart (60d)
   - Article summary: one card per article
     showing process breakdown in sequence
══════════════════════════════════════════ */
function DailyView({ days, orderTimelines, orders, items, activeDayIdx, setActiveDayIdx, orderColorMap, onDrillHourly, setSelectedOrderId, windowOffset, setWindowOffset, setActuals, setOrders, gid }:
    { days: DayPlan[]; orderTimelines: SimResult['orderTimelines']; orders: ProductionOrder[]; items: ProductionItem[]; activeDayIdx: number; setActiveDayIdx: (d: number) => void; orderColorMap: Record<string, OrderColor>; onDrillHourly: () => void; setSelectedOrderId: (id: string | null) => void; windowOffset: number; setWindowOffset: (n: number) => void; setActuals: React.Dispatch<React.SetStateAction<any[]>>; setOrders: React.Dispatch<React.SetStateAction<ProductionOrder[]>>; gid: () => string; }) {

    const activeDay = days[activeDayIdx];
    const sortedOrders = [...orders].sort((a, b) => a.priority - b.priority);
    const visibleDays = days.slice(windowOffset, windowOffset + 40);

    /* stats */
    const totalWorking = activeDay?.hours.flatMap(h => h.slots).reduce((s, sl) => { s.add(sl.workerId); return s; }, new Set<string>()).size ?? 0;

    return (
        <div className="space-y-3">
            {/* stats row omitted ... */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'Orders', value: orders.length, color: '#6366f1', icon: <Target size={14} className="text-indigo-500" /> },
                    { label: 'Workers Active', value: totalWorking, color: '#10b981', icon: <Users size={14} className="text-emerald-500" /> },
                    { label: 'Active Day', value: `D${activeDayIdx + 1}`, color: '#0ea5e9', icon: <Calendar size={14} className="text-sky-500" /> },
                    { label: 'Articles Today', value: activeDay?.articlesSummary.length ?? 0, color: '#f59e0b', icon: <Box size={14} className="text-amber-500" /> },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: `${s.color}18` }}>{s.icon}</div>
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</div>
                            <div className="text-xl font-black text-slate-900 leading-tight">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* GANTT ... */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <BarChart3 size={13} className="text-indigo-500" />
                        Gantt Visualisation
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWindowOffset(Math.max(0, windowOffset - 10))}
                            disabled={windowOffset === 0}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-24 text-center">Day {windowOffset + 1} - {windowOffset + 40}</span>
                        <button
                            onClick={() => setWindowOffset(Math.min(20, windowOffset + 10))}
                            disabled={windowOffset === 20}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
                <div className="overflow-hidden">
                    <div className="w-full p-3">
                        <div className="flex mb-1.5 pl-32">
                            {visibleDays.map((d, vi) => {
                                const i = windowOffset + vi;
                                return (
                                    <button key={i} onClick={() => setActiveDayIdx(i)} className={`flex-1 text-center text-[7px] font-black border-r border-slate-100 pb-1 transition-colors ${activeDayIdx === i ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-600'}`}>
                                        {i % 5 === 0 ? `${d.date.getDate()}/${d.date.getMonth() + 1}` : ''}
                                    </button>
                                );
                            })}
                        </div>
                        {sortedOrders.map(o => {
                            const tl = orderTimelines[o.id];
                            const part = items.find(i => i.id === o.mainPartId);
                            const c = orderColorMap[o.id];
                            if (!c) return null;
                            return (
                                <div key={`${o.id}-${o.businessId || 'root'}`} className="flex items-center mb-1 cursor-pointer opacity-80 hover:opacity-100" onClick={() => { setSelectedOrderId(o.id); onDrillHourly(); }}>
                                    <div className="w-32 shrink-0 pr-2 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.bg }} />
                                        <span className="text-[9px] font-bold text-slate-700 truncate">{part?.name ?? '?'}</span>
                                    </div>
                                    <div className="flex-1 h-4 relative flex">
                                        {visibleDays.map((d, vi) => {
                                            const i = windowOffset + vi;
                                            const hasAct = d.articlesSummary.some(a => a.orderId === o.id);
                                            const inRange = tl && i >= tl.firstDay && i <= tl.lastDay;
                                            const isF = tl?.firstDay === i; const isL = tl?.lastDay === i;

                                            // Ensure pill caps render correctly even if the first/last day is cut off by the window
                                            const renderFirst = isF || (inRange && vi === 0);
                                            const renderLast = isL || (inRange && vi === 39);

                                            return (
                                                <div key={i} onClick={(e) => { e.stopPropagation(); setActiveDayIdx(i); }} className={`flex-1 h-full border-r border-slate-50 cursor-pointer ${activeDayIdx === i ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}>
                                                    {inRange && <div className="h-full flex items-center" style={{ backgroundColor: hasAct ? c.bg : c.light, borderRadius: `${renderFirst ? '4px 0 0 4px' : '0'}${renderLast ? ' 0 4px 4px 0' : ''}` }}>
                                                        {hasAct && renderFirst && <span className="text-white text-[7px] font-bold px-1 truncate">{part?.name}</span>}
                                                    </div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {sortedOrders.length === 0 && <p className="py-6 text-center text-slate-400 text-xs font-bold">Add orders to visualise the Gantt</p>}
                    </div>
                </div>
            </div>

            {/* ── PRODUCTION ROSTER ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <Activity size={13} className="text-emerald-500" />Day {activeDayIdx + 1} · Production Roster
                        <span className="font-normal text-slate-400 normal-case text-[9px] ml-1">{activeDay?.date?.toLocaleDateString()}</span>
                    </h2>
                    <button onClick={onDrillHourly} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg">
                        Hourly Detail <ArrowRight size={11} />
                    </button>
                </div>

                {(!activeDay || activeDay.articlesSummary.length === 0) ? (
                    <div className="py-14 text-center text-slate-400 text-xs font-bold">No production scheduled for this day</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Article</th>
                                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[100px] text-center">Process</th>
                                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[90px] text-center">Output (Today)</th>
                                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Personnel Assigned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeDay.articlesSummary.map(art =>
                                    art.byProcess.map((proc, pi) => (
                                        <tr
                                            key={`${art.orderId}-${art.businessId || 'root'}-${pi}`}
                                            className="border-b border-slate-50 hover:bg-indigo-50/20 cursor-pointer transition-colors"
                                            onClick={() => { setSelectedOrderId(art.orderId); onDrillHourly(); }}
                                        >
                                            {/* Article name — only show on first process row */}
                                            {pi === 0 ? (
                                                <td className="px-4 py-2.5" rowSpan={art.byProcess.length}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: art.color.bg }} />
                                                        <div>
                                                            <div className="text-sm font-black text-slate-800 leading-tight">{art.partName}</div>
                                                            <div className="text-[10px] font-bold text-slate-500 tabular-nums">{Math.round(art.totalUnits)} <span className="text-slate-400 font-medium">total u/day</span></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            ) : null}

                                            {/* Process step */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center border" style={{ backgroundColor: art.color.light, color: art.color.text, borderColor: art.color.border }}>{proc.sequence}</span>
                                                    <span className="text-xs font-black text-slate-700 whitespace-nowrap">{proc.procName}</span>
                                                </div>
                                            </td>

                                            {/* Units */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-sm font-black text-slate-800 tabular-nums">{Math.round(proc.units)}</span>
                                                <span className="text-[9px] text-slate-400 font-bold ml-1">u</span>
                                            </td>

                                            {/* Personnel */}
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {proc.assignments.map((as, ai) => (
                                                        <div key={ai} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 hover:bg-white hover:border-indigo-100 transition-colors shadow-sm">
                                                            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-[10px]">{as.worker.charAt(0)}</div>
                                                            <div>
                                                                <div className="text-xs font-black text-slate-800 leading-none">{as.worker}</div>
                                                            </div>
                                                            {as.machine !== 'Manual' && (
                                                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 ml-1.5 shadow-sm inline-flex items-center gap-1">
                                                                    <Box size={10} className="text-amber-500" /> {as.machine}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── STANDBY CAPACITY ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <AlertCircle size={13} className="text-amber-500" /> Standby Capacity
                    </h2>
                    <div className="flex items-center gap-3 text-[9px] font-black text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md"><Users size={10} className="text-indigo-400" />{activeDay?.unusedPersonnel.length} People</span>
                        <span className="w-px h-4 bg-slate-200" />
                        <span className="flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md"><Box size={10} className="text-amber-400" />{activeDay?.unusedMachinery.length} Machines</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-100">
                    {/* Personnel */}
                    <div className="p-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Users size={10} className="text-indigo-400" /> Unused Personnel</div>
                        {(activeDay?.unusedPersonnel.length ?? 0) === 0 ? (
                            <div className="text-[10px] text-slate-400 font-bold italic py-2">All personnel on shift</div>
                        ) : (
                            <div className="space-y-2">
                                {activeDay?.unusedPersonnel.map((emp, ei) => (
                                    <div key={ei} className="flex items-start gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-[10px] shrink-0">{emp.name.charAt(0)}</div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-black text-slate-800 truncate">{emp.name}</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {emp.skills.map((s, si) => (
                                                    <span key={si} className="text-[7px] font-bold px-1 py-0.5 bg-indigo-50 text-indigo-500 rounded border border-indigo-100 uppercase">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Machinery */}
                    <div className="p-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Box size={10} className="text-amber-400" /> Idle Machinery</div>
                        {(activeDay?.unusedMachinery.length ?? 0) === 0 ? (
                            <div className="text-[10px] text-slate-400 font-bold italic py-2">All machines in use</div>
                        ) : (
                            <div className="space-y-2">
                                {activeDay?.unusedMachinery.map((name, ni) => (
                                    <div key={ni} className="flex items-center gap-2.5 p-2 bg-amber-50/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors">
                                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm"><Box size={14} /></div>
                                        <div>
                                            <div className="text-xs font-black text-slate-800">{name}</div>
                                            <div className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border border-emerald-100">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Standby
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   HOURLY VIEW
   Rows = Processes (sorted by sequence)
   Cols = Hours (0-7)
   Each cell: units + employee badges
   + Daily total column per process
   + Hour total row at bottom
══════════════════════════════════════════ */
function HourlyView({ day, dayIdx, activeHourIdx, setActiveHourIdx, empColorMap, orderColorMap, selectedOrderId, setSelectedOrderId, orders, items }:
    { day: DayPlan | undefined; dayIdx: number; activeHourIdx: number; setActiveHourIdx: (h: number) => void; empColorMap: Record<string, string>; orderColorMap: Record<string, OrderColor>; selectedOrderId: string | null; setSelectedOrderId: (id: string | null) => void; orders: ProductionOrder[]; items: ProductionItem[]; }) {

    if (!day) return <Empty msg="No data for this day." />;
    const allSlots = day.hours.flatMap(h => h.slots);
    if (allSlots.length === 0) return <Empty msg="No production scheduled for this day." />;

    /* Build process grid: procName → { sequence, orderId, hours, dayTotal } */
    type ProcRow = { procName: string; sequence: number; orderId: string; hours: Record<number, { units: number; workers: { name: string; color: string }[] }>; dayTotal: number; };
    const grid: Record<string, ProcRow> = {};
    day.hours.forEach(hs => {
        hs.slots.forEach(s => {
            // Filter by selected order if applicable
            if (selectedOrderId && s.orderId !== selectedOrderId) return;

            const key = `${s.orderId}__${s.procName}`;
            if (!grid[key]) grid[key] = { procName: s.procName, sequence: s.sequence, orderId: s.orderId, hours: {}, dayTotal: 0 };
            if (!grid[key].hours[hs.hour]) grid[key].hours[hs.hour] = { units: 0, workers: [] };
            grid[key].hours[hs.hour].units += s.units;
            grid[key].dayTotal += s.units;
            const hw = grid[key].hours[hs.hour].workers;
            if (!hw.find(w => w.name === s.worker)) hw.push({ name: s.worker, color: empColorMap[s.workerId] ?? '#6366f1' });
        });
    });
    const rows = Object.values(grid).sort((a, b) => a.sequence - b.sequence);

    /* Hour totals */
    const hourTotals = Array.from({ length: 8 }, (_, h) => rows.reduce((s, r) => s + (r.hours[h]?.units ?? 0), 0));
    const grandTotal = rows.reduce((s, r) => s + r.dayTotal, 0);

    return (
        <div className="space-y-4">
            {/* ARTICLE FILTER PILLS */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="text-[9px] font-black uppercase tracking-tighter text-slate-400 pl-2">Filter Article:</div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                        onClick={() => setSelectedOrderId(null)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all border ${!selectedOrderId ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}
                    >
                        All Articles
                    </button>
                    {orders.map(o => {
                        const part = items.find(i => i.id === o.mainPartId);
                        const c = orderColorMap[o.id];
                        const isSel = selectedOrderId === o.id;
                        return (
                            <button
                                key={o.id}
                                onClick={() => setSelectedOrderId(isSel ? null : o.id)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all border flex items-center gap-1.5 ${isSel ? 'ring-2 ring-offset-1 ring-indigo-500' : 'opacity-70 hover:opacity-100'}`}
                                style={{
                                    backgroundColor: isSel ? c?.bg : c?.light,
                                    color: isSel ? 'white' : c?.text,
                                    borderColor: isSel ? c?.bg : c?.border
                                }}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : ''}`} style={{ backgroundColor: isSel ? 'white' : c?.bg }} />
                                {part?.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <Clock size={13} className="text-sky-500" />
                        {selectedOrderId ? `Process View: ${items.find(i => i.id === orders.find(o => o.id === selectedOrderId)?.mainPartId)?.name}` : `Day ${dayIdx + 1} — Processes × Hours`}
                    </h2>
                    <span className="text-[9px] text-slate-400 font-bold">Click a cell to see minute detail →</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ minWidth: 780 }}>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-3 py-2 text-left sticky left-0 bg-slate-50 border-r border-slate-100 w-44">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Process (seq)</span>
                                </th>
                                {Array.from({ length: 8 }, (_, h) => (
                                    <th key={h} className="text-center border-r border-slate-100">
                                        <button onClick={() => setActiveHourIdx(h)} className={`w-full py-2 px-1 text-[8px] font-black uppercase transition-colors ${activeHourIdx === h ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}>
                                            {fh(h)}
                                        </button>
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-center bg-slate-50">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Day Total</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => {
                                const c = orderColorMap[row.orderId];
                                const isLast = ri < rows.length - 1 && rows[ri + 1].sequence > row.sequence;
                                return (
                                    <tr key={`${row.orderId}-${row.procName}`} className={`border-b ${isLast ? 'border-b-2 border-b-slate-200' : 'border-slate-50'} hover:bg-slate-50/50`}>
                                        {/* Process label */}
                                        <td className="px-3 py-2 sticky left-0 bg-white border-r border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center text-white shrink-0" style={{ backgroundColor: c?.bg ?? '#6366f1' }}>{row.sequence}</span>
                                                <div>
                                                    <div className="text-[9px] font-black text-slate-800 uppercase tracking-tight">{row.procName}</div>
                                                    {row.sequence > 1 && <div className="flex items-center gap-0.5 text-[7px] text-slate-400 font-bold"><Lock size={7} />requires seq {row.sequence - 1}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Hour cells */}
                                        {Array.from({ length: 8 }, (_, h) => {
                                            const cell = row.hours[h];
                                            const isActive = activeHourIdx === h;
                                            return (
                                                <td key={h} className={`border-r border-slate-50 p-1 align-top ${isActive ? 'bg-indigo-50/40' : ''}`}>
                                                    {cell ? (
                                                        <button onClick={() => setActiveHourIdx(h)} className="w-full min-h-[52px] rounded-lg p-1.5 text-left border transition-all hover:shadow-sm" style={{ backgroundColor: c?.light ?? '#eef2ff', borderColor: c?.border ?? '#c7d2fe' }}>
                                                            <div className="text-sm font-black tabular-nums leading-none mb-1" style={{ color: c?.text ?? '#4338ca' }}>{Math.round(cell.units)}u</div>
                                                            <div className="flex flex-wrap gap-0.5">
                                                                {cell.workers.map((w, wi) => (
                                                                    <span key={wi} className="text-[6px] font-black text-white px-1 py-0.5 rounded-full" style={{ backgroundColor: w.color }}>{w.name.charAt(0)}{w.name.split(' ')[1]?.charAt(0) ?? ''}</span>
                                                                ))}
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="w-full min-h-[52px] rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                            <span className="text-[8px] text-slate-200 font-bold">—</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        {/* Day total */}
                                        <td className="px-3 py-2 text-center">
                                            <div className="text-sm font-black tabular-nums" style={{ color: c?.text ?? '#4338ca' }}>{Math.round(row.dayTotal)}u</div>
                                            <div className="text-[7px] text-slate-400 font-bold">total</div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* HOUR TOTALS ROW */}
                            <tr className="bg-slate-50 border-t-2 border-slate-200">
                                <td className="px-3 py-2 sticky left-0 bg-slate-50 border-r border-slate-200">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Hour Total</span>
                                </td>
                                {hourTotals.map((t, h) => (
                                    <td key={h} className="px-2 py-2 text-center border-r border-slate-100">
                                        {t > 0 ? <span className="text-[10px] font-black text-slate-700 tabular-nums">{Math.round(t)}u</span> : <span className="text-[8px] text-slate-300 font-bold">—</span>}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center">
                                    <div className="text-sm font-black text-slate-800 tabular-nums">{Math.round(grandTotal)}u</div>
                                    <div className="text-[7px] text-slate-500 font-bold">GRAND</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* HOUR SUMMARY CARDS */}
            <div className="grid grid-cols-8 gap-2">
                {day.hours.map(hs => {
                    const workers = new Set(hs.slots.map(s => s.workerId)).size;
                    const procs = new Set(hs.slots.map(s => s.procName)).size;
                    const units = hs.slots.reduce((s, sl) => s + sl.units, 0);
                    const isActive = activeHourIdx === hs.hour;
                    return (
                        <button key={hs.hour} onClick={() => setActiveHourIdx(hs.hour)} className={`bg-white rounded-xl border p-2 text-left transition-all shadow-sm ${isActive ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{fh(hs.hour)}</div>
                            <div className="text-base font-black text-slate-900">{Math.round(units)}</div>
                            <div className="text-[7px] text-slate-400 font-bold">{workers}w · {procs}p</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MINUTE VIEW — per-employee timeline bar
══════════════════════════════════════════ */
function MinuteView({ day, hourIdx, dayIdx, empColorMap, orderColorMap, onBack, onHourChange, selectedOrderId, orders, items, setItems, employees, actuals, setActuals, setOrders, inventory, setInventory, gid, planStartDate }:
    { day: DayPlan | undefined; hourIdx: number; dayIdx: number; empColorMap: Record<string, string>; orderColorMap: Record<string, OrderColor>; onBack: () => void; onHourChange: (h: number) => void; selectedOrderId: string | null; orders: ProductionOrder[]; items: ProductionItem[]; setItems: any; employees: Employee[]; actuals: any[]; setActuals: React.Dispatch<React.SetStateAction<any[]>>; setOrders: React.Dispatch<React.SetStateAction<ProductionOrder[]>>; inventory: any[]; setInventory: React.Dispatch<React.SetStateAction<any[]>>; gid: () => string; planStartDate?: string; }) {

    if (!day) return <Empty msg="No data for this day." />;

    const SHIFT_MINUTES = 8 * 60; // 480 mins
    type EmpTimeline = { id: string; name: string; skills: string[]; color: string; slots: (MinuteSlot | null)[] };
    const empMap: Record<string, EmpTimeline> = {};

    day.hours.forEach(hs => {
        hs.slots.forEach(s => {
            if (selectedOrderId && s.orderId !== selectedOrderId) return;
            if (!empMap[s.workerId]) empMap[s.workerId] = { id: s.workerId, name: s.worker, skills: employees.find(e => e.id === s.workerId)?.skills || [], color: empColorMap[s.workerId] ?? '#6366f1', slots: Array(SHIFT_MINUTES).fill(null) };

            const globalMin = (hs.hour * 60) + s.minuteStart;
            const globalEnd = (hs.hour * 60) + s.minuteEnd;
            for (let m = globalMin; m < globalEnd && m < SHIFT_MINUTES; m++) {
                empMap[s.workerId].slots[m] = s;
            }
        });
    });

    const entries = Object.values(empMap);

    function runs(slots: (MinuteSlot | null)[]) {
        const r: { slot: MinuteSlot | null; start: number; len: number; totalPlanned: number }[] = [];
        let i = 0;
        while (i < slots.length) {
            const cur = slots[i];
            let j = i + 1;
            let sumU = cur ? cur.units : 0;
            while (j < slots.length) {
                const nx = slots[j];
                if (!nx && !cur) { j++; continue; }
                if (nx && cur && nx.orderId === cur.orderId && nx.procName === cur.procName) {
                    sumU += nx.units;
                    j++;
                    continue;
                }
                break;
            }
            r.push({ slot: cur, start: i, len: j - i, totalPlanned: sumU });
            i = j;
        }
        return r;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"><ChevronLeft size={11} />Back</button>
                <div className="h-4 w-px bg-slate-200" />
                <h1 className="text-xs font-black text-slate-700 uppercase tracking-widest">Shift Timeline (480 mins)</h1>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <Timer size={13} className="text-violet-500" />Day {dayIdx + 1} · Shift Controls
                    </h2>
                </div>

                <div className="p-4 overflow-x-auto custom-scrollbar bg-white">
                    <div className="min-w-[1200px] space-y-2">
                        {/* Time Markers */}
                        <div className="flex items-center h-5 relative mb-1">
                            <div className="w-48 shrink-0" /> {/* Employee Spacer */}
                            <div className="flex-1 relative h-full">
                                <div className="absolute inset-0 flex items-center justify-center -top-8 text-[8px] font-black uppercase tracking-widest text-slate-300 pointer-events-none">Visual Timeline Control</div>
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${(i / 8) * 100}%` }}>
                                        <div className="h-2 w-px bg-slate-200 mb-1" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{fh(i)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="w-60 shrink-0 text-center text-[7px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-100 py-0.5 rounded-full ml-3 tracking-tighter">Daily Yield Ledger</div>
                        </div>

                        {entries.length === 0 ? <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No staffing activity for this day</div> : (
                            entries.map(emp => {
                                const r = runs(emp.slots);
                                return (
                                    <div key={emp.id} className="flex items-stretch group gap-3">
                                        <div className="w-48 shrink-0 flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg text-[9px] font-black text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-white ring-2 ring-slate-50" style={{ backgroundColor: emp.color }}>{emp.name.charAt(0)}</div>
                                            <div className="min-w-0">
                                                <div className="text-[9px] font-black text-slate-700 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none mb-0.5">{emp.name}</div>
                                                <div className="text-[6px] text-slate-400 font-bold uppercase truncate">{emp.skills.slice(0, 2).join(' · ')}</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative flex border border-slate-100 shadow-inner group-hover:border-slate-200 transition-all">
                                            {r.map((run, ri) => {
                                                const c = run.slot ? orderColorMap[run.slot.orderId] : null;
                                                return (
                                                    <div key={ri} className="absolute top-0 h-full border-r border-white/5" style={{ left: `${(run.start / SHIFT_MINUTES) * 100}%`, width: `${(run.len / SHIFT_MINUTES) * 100}%` }}>
                                                        {run.slot ? (
                                                            <div
                                                                className="h-full w-full flex flex-col justify-center py-1 px-1.5 overflow-hidden transition-all hover:brightness-110 shadow-[inner_0_1px_0_0_rgba(255,255,255,0.2)]"
                                                                style={{ backgroundColor: c?.bg ?? '#6366f1' }}
                                                            >
                                                                {(run.len / SHIFT_MINUTES) > 0.03 && <span className="text-white text-[7px] font-black leading-tight uppercase truncate">{run.slot.procName}</span>}
                                                                {(run.len / SHIFT_MINUTES) > 0.05 && <span className="text-white/50 text-[6px] font-bold leading-none">{Math.round(run.totalPlanned)}u</span>}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                            {/* Shift Dividers */}
                                            {Array.from({ length: 7 }).map((_, i) => (
                                                <div key={i} className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none" style={{ left: `${((i + 1) / 8) * 100}%` }} />
                                            ))}
                                        </div>

                                        {/* COMPACT PER-EMPLOYEE YIELD LEDGER */}
                                        <div className="w-60 shrink-0 flex flex-col gap-0.5 overflow-y-auto max-h-[80px] custom-scrollbar pr-1 ml-3">
                                            {Object.values(
                                                r.filter(run => run.slot).reduce((acc: any, run) => {
                                                    const key = `${run.slot!.orderId}__${run.slot!.procName}`;
                                                    if (!acc[key]) acc[key] = {
                                                        procName: run.slot!.procName,
                                                        partName: run.slot!.partName,
                                                        sequence: run.slot!.sequence,
                                                        totalPlanned: 0,
                                                        orderId: run.slot!.orderId,
                                                        businessId: run.slot!.businessId
                                                    };
                                                    acc[key].totalPlanned += run.totalPlanned;
                                                    return acc;
                                                }, {})
                                            ).map((agg: any, ai) => {
                                                const actualRecord = actuals.find(a => a.dayIdx === dayIdx && a.orderId === agg.orderId && a.procName === agg.procName && a.workerId === emp.id);
                                                return (
                                                    <YieldInput
                                                        key={ai}
                                                        agg={agg}
                                                        dayIdx={dayIdx}
                                                        emp={emp}
                                                        actualRecord={actualRecord}
                                                        items={items}
                                                        setItems={setItems}
                                                        setActuals={setActuals}
                                                        setOrders={setOrders}
                                                        inventory={inventory}
                                                        setInventory={setInventory}
                                                        gid={gid}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Empty({ msg }: { msg: string }) {
    return <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-3"><AlertCircle size={32} /><p className="text-xs font-bold text-slate-400 text-center max-w-xs">{msg}</p></div>;
}

function RosterView({ actuals, employees, items, orders, dates, activeDayIdx }: { actuals: any[], employees: Employee[], items: ProductionItem[], orders: ProductionOrder[], dates: Date[], activeDayIdx: number }) {
    const dayActuals = actuals.filter(a => a.dayIdx === activeDayIdx);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                    <ClipboardList size={13} className="text-indigo-500" /> Operational Daily Roster · {dates[activeDayIdx]?.toLocaleDateString()}
                </h2>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Registry of Actual Production & Processes</div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="p-3 text-[8px] font-black uppercase text-slate-400 tracking-wider">Worker</th>
                            <th className="p-3 text-[8px] font-black uppercase text-slate-400 tracking-wider">Article / Order</th>
                            <th className="p-3 text-[8px] font-black uppercase text-slate-400 tracking-wider">Process</th>
                            <th className="p-3 text-[8px] font-black uppercase text-slate-400 tracking-wider text-right">Actual Yield</th>
                            <th className="p-3 text-[8px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {dayActuals.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No production records for this day</td></tr>
                        ) : (
                            dayActuals.map((a, i) => {
                                const emp = employees.find(e => e.id === a.workerId);
                                const order = orders.find(o => o.id === a.orderId);
                                const part = items.find(it => it.id === order?.mainPartId);
                                const maxSeq = part ? Math.max(...part.processes.map((p: any) => p.sequence), 0) : 0;
                                const currentSeq = part?.processes.find((p: any) => p.processName === a.procName)?.sequence || 0;
                                const isFinal = currentSeq === maxSeq && maxSeq > 0;

                                return (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-indigo-50 text-[10px] font-black text-indigo-500 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-all">{emp?.name.charAt(0)}</div>
                                                <div className="text-[10px] font-black text-slate-700 uppercase">{emp?.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-3 min-w-[200px]">
                                            <div className="text-[9px] font-black text-indigo-600 uppercase mb-0.5">{part?.name}</div>
                                            <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">Order ID: {a.orderId.substring(0, 8)}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-[9px] font-bold text-slate-600 uppercase">{a.procName}</div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="text-[11px] font-black tabular-nums text-slate-900">{a.units} <span className="text-[7px] text-slate-400 uppercase tracking-tighter">Units</span></div>
                                        </td>
                                        <td className="p-3 text-center">
                                            {isFinal ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase tracking-widest border border-emerald-200/50 shadow-sm">Finished</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[7px] font-black uppercase tracking-widest border border-blue-200/50 shadow-sm">Process WIP</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function YieldInput({ agg, dayIdx, emp, actualRecord, items, setItems, setActuals, setOrders, inventory, setInventory, gid }: { agg: any, dayIdx: number, emp: any, actualRecord: any, items: ProductionItem[], setItems: any, setActuals: any, setOrders: any, inventory: any[], setInventory: any, gid: any }) {
    const [val, setVal] = useState(actualRecord?.units ?? 0);
    const [confirmed, setConfirmed] = useState(!!actualRecord);

    const itm = items.find(it => it.id === agg.orderId || it.name === agg.partName);
    const maxSeq = itm ? Math.max(...itm.processes.map(p => p.sequence), 0) : 0;
    const isFinal = agg.sequence === maxSeq && maxSeq > 0;

    const handleConfirm = async () => {
        if (val < 0) return;
        const prevVal = actualRecord?.units || 0;

        // Update Actuals (Roster Local)
        setActuals((prev: any[]) => [
            ...prev.filter(x => !(x.dayIdx === dayIdx && x.orderId === agg.orderId && x.procName === agg.procName && x.workerId === emp.id)),
            { dayIdx, orderId: agg.orderId, procName: agg.procName, workerId: emp.id, units: val, businessId: agg.businessId }
        ]);

        // REGISTER IN DATABASE (Roster Permanent)
        console.log('Finalizing yield registration:', { workerId: emp.id, orderId: agg.orderId, qty: val });

        // ── INVENTORY MATERIAL DEDUCTION ──
        // When we confirm a yield, we deduct the required materials for THIS step from the local items/stocks.
        const diff = val - prevVal;
        if (diff > 0 && itm) {
            const stepBom = itm.bom.filter((b: any) =>
                b.processName === agg.procName || (agg.sequence === 1 && !b.processName)
            );

            if (stepBom.length > 0) {
                setItems((prev: any[]) => prev.map(item => {
                    const bomReq = stepBom.find((b: any) => b.accessoryId === item.id);
                    if (bomReq) {
                        return { ...item, stockQuantity: Math.max(0, item.stockQuantity - (diff * bomReq.usageQuantity)) };
                    }
                    return item;
                }));
            }
        }

        await logProduction({
            businessId: agg.businessId,
            workerId: emp.id,
            orderId: agg.orderId,
            articleName: agg.partName,
            procName: agg.procName,
            isFinal,
            quantity: val,
            date: new Date().toISOString()
        });

        // If final process, push to Shipping Inventory
        if (isFinal && val > 0) {
            const diff = val - prevVal;
            if (diff !== 0) {
                setOrders((prev: any[]) => prev.map(o => o.id === agg.orderId ? { ...o, finishedQuantity: (o.finishedQuantity || 0) + diff } : o));

                const ni = {
                    id: gid(),
                    orderId: agg.orderId,
                    name: agg.partName,
                    quantity: diff,
                    confirmDate: new Date().toISOString().split('T')[0],
                    businessId: agg.businessId
                };
                setInventory((prev: any[]) => [ni, ...prev]);
            }
        }
        setConfirmed(true);
    };

    return (
        <div className={`flex items-center gap-3 p-1.5 rounded-xl border-2 transition-all shadow-md ${confirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-indigo-300'}`}>
            <div className="flex-1 min-w-0 px-1">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black truncate uppercase tracking-tighter ${confirmed ? 'text-emerald-800' : 'text-slate-900'}`}>{agg.procName}</span>
                    <span className="text-[10px] font-black text-indigo-600 tabular-nums bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50">{Math.round(agg.totalPlanned)}u</span>
                </div>
                <div className="text-[8px] text-slate-500 font-bold uppercase truncate tracking-tight">{agg.partName}</div>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <input
                        type="number"
                        value={val || ''}
                        onChange={(e) => { setVal(Number(e.target.value)); setConfirmed(false); }}
                        placeholder="0"
                        className={`w-14 h-9 border-2 text-[14px] font-black rounded-xl text-center transition-all outline-none shadow-sm ${confirmed
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                : 'bg-slate-50 border-slate-200 text-indigo-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                            }`}
                    />
                </div>
                <button
                    onClick={handleConfirm}
                    disabled={confirmed || val <= 0}
                    className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center shadow-lg border-2 ${confirmed
                            ? 'text-emerald-600 bg-white border-emerald-200'
                            : 'text-white bg-indigo-600 border-indigo-500 hover:bg-emerald-600 hover:border-emerald-500 shadow-indigo-100 active:scale-90 disabled:opacity-20 disabled:grayscale'
                        }`}
                >
                    <RefreshCw size={16} className={confirmed ? '' : 'text-white'} />
                </button>
            </div>
        </div>
    );
}

function InventoryView({ inventory, items, businessId, setInventory }: { inventory: any[], items: ProductionItem[], businessId?: string, setInventory: React.Dispatch<React.SetStateAction<any[]>> }) {
    // Filter by businessId if provided
    const list = businessId ? inventory.filter(i => i.businessId === businessId) : inventory;

    // Group by Article Name
    const aggregated = list.reduce((acc: any, curr) => {
        if (!acc[curr.name]) acc[curr.name] = { name: curr.name, quantity: 0, items: [] };
        acc[curr.name].quantity += curr.quantity;
        acc[curr.name].items.push(curr);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                    <Box size={13} className="text-indigo-500" /> Shipping Inventory · Ready Items
                </h2>
                <div className="flex items-center gap-3">
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Live Stock Tracker</div>
                    <button onClick={() => setInventory([])} className="text-[8px] font-black text-rose-500 uppercase hover:underline">Clear Records</button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 gap-6">
                    {Object.values(aggregated).map((group: any, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{group.name}</h3>
                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Available Stock</div>
                                </div>
                                <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-lg font-black tabular-nums border border-indigo-100 shadow-sm">
                                    {group.quantity} <span className="text-[8px] uppercase font-bold">pcs</span>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
                                {group.items.slice(0, 5).map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-slate-400">{item.confirmDate}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-emerald-500">+</span>
                                            <span className="text-slate-600">{item.quantity} units</span>
                                        </div>
                                    </div>
                                ))}
                                {group.items.length > 5 && <div className="text-[7px] text-slate-300 font-black uppercase text-center pt-2 italic">+{group.items.length - 5} additional logs</div>}
                            </div>
                        </div>
                    ))}
                    {Object.keys(aggregated).length === 0 && (
                        <div className="col-span-full py-32 text-center">
                            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Box size={24} className="text-slate-300" /></div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No inventory registrations found</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
