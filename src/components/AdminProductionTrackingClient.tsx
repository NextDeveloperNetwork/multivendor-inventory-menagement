'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    ClipboardList, Trash2, Activity,
    Search, Download, FileJson, LayoutGrid,
    BarChart2, ChevronLeft, ChevronRight, Users, Package
} from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { deleteProductionLog, getAdminDailyProductionLogs } from '@/app/actions/production';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ─────────────────────── helpers ─────────────────────── */
function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function articleKey(log: any) { return log.articleId || log.articleName; }

/* ─────────────────────── types ───────────────────────── */
interface Props { initialLogs: any[]; employees: any[]; businessId?: string; }

type CellMode = 'empty' | 'ghost' | 'active';

/* ════════════════════════════════════════════════════════
   CANDLE CELL
   mode=active  → solid indigo candle (body + wicks if multi)
   mode=ghost   → faint connector bar linking entries
   mode=empty   → blank
════════════════════════════════════════════════════════ */
function CandleCell({
    dayLogs, employees, maxQty, mode, isFirst, isLast,
}: {
    dayLogs: any[];
    employees: any[];
    maxQty: number;
    mode: CellMode;
    isFirst: boolean;
    isLast: boolean;
}) {
    const ROW_H = 64; // px – row height
    const MAX_BODY = 44;
    const MIN_BODY = 10;

    if (mode === 'empty') {
        return <div style={{ height: ROW_H }} />;
    }

    if (mode === 'ghost') {
        // Horizontal connecting rail, no candle
        return (
            <div className="relative flex items-center justify-center" style={{ height: ROW_H }}>
                {/* Left arm */}
                <div className="absolute" style={{
                    left: 0, right: '50%', top: '50%', height: 2,
                    background: 'rgba(99,102,241,0.15)',
                    transform: 'translateY(-50%)',
                }} />
                {/* Right arm */}
                <div className="absolute" style={{
                    left: '50%', right: 0, top: '50%', height: 2,
                    background: 'rgba(99,102,241,0.15)',
                    transform: 'translateY(-50%)',
                }} />
                {/* Centre dot */}
                <div className="w-1.5 h-1.5 rounded-full z-10"
                    style={{ background: 'rgba(99,102,241,0.25)' }} />
            </div>
        );
    }

    // ── active ──
    const total = dayLogs.reduce((s, l) => s + l.quantity, 0);
    const multi = dayLogs.length > 1;
    const bodyH = Math.max(MIN_BODY, Math.round((total / Math.max(maxQty, 1)) * MAX_BODY));

    const workerMap: Record<string, { name: string; qty: number }> = {};
    dayLogs.forEach(l => {
        const name = employees.find(e => e.id === l.workerId)?.name || 'Manager';
        if (!workerMap[l.workerId]) workerMap[l.workerId] = { name, qty: 0 };
        workerMap[l.workerId].qty += l.quantity;
    });
    const workers = Object.values(workerMap);

    return (
        <div className="group/candle relative flex items-center justify-center" style={{ height: ROW_H }}>
            {/* Left connecting rail (to previous cell) */}
            {!isFirst && (
                <div className="absolute pointer-events-none" style={{
                    left: 0, right: '50%', top: '50%', height: 2,
                    background: 'rgba(99,102,241,0.18)',
                    transform: 'translateY(-50%)',
                }} />
            )}
            {/* Right connecting rail */}
            {!isLast && (
                <div className="absolute pointer-events-none" style={{
                    left: '50%', right: 0, top: '50%', height: 2,
                    background: 'rgba(99,102,241,0.18)',
                    transform: 'translateY(-50%)',
                }} />
            )}

            {/* Candle stack */}
            <div className="flex flex-col items-center z-10">
                {multi && <div style={{ width: 1.5, height: 6, background: '#6366f1', borderRadius: 2, opacity: 0.7 }} />}
                <div
                    className="rounded-[3px] cursor-pointer transition-all duration-200 group-hover/candle:scale-110"
                    style={{
                        width: multi ? 18 : 14,
                        height: bodyH,
                        background: multi
                            ? 'linear-gradient(180deg,#818cf8 0%,#4f46e5 100%)'
                            : 'linear-gradient(180deg,#a5b4fc 0%,#6366f1 100%)',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                    }}
                />
                {multi && <div style={{ width: 1.5, height: 6, background: '#6366f1', borderRadius: 2, opacity: 0.7 }} />}
            </div>

            {/* Tooltip */}
            <div className={`
                pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                opacity-0 group-hover/candle:opacity-100 translate-y-1 group-hover/candle:translate-y-0
                transition-all duration-150 z-50
                bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10
                min-w-[156px] p-3
            `}>
                <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-white/10">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Day Total</span>
                    <span className="text-[13px] font-black tabular-nums text-indigo-300">{total.toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                    {workers.map((w, i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-1 h-1 rounded-full bg-indigo-400 flex-none" />
                                <span className="text-[9px] text-slate-300 truncate">{w.name}</span>
                            </div>
                            <span className="text-[9px] font-bold tabular-nums">{w.qty.toLocaleString()}</span>
                        </div>
                    ))}
                    {multi && <div className="text-[8px] text-slate-600 text-right">{dayLogs.length} entries</div>}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #0f172a' }} />
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function AdminProductionTrackingClient({ initialLogs, employees, businessId }: Props) {
    const [logs, setLogs] = useState<any[]>(initialLogs);
    const [startDate, setStartDate] = useState(localToday);
    const [endDate, setEndDate] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

    useEffect(() => { setIsLoaded(true); }, []);

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            setIsLoading(true);
            try {
                const fresh = await getAdminDailyProductionLogs(businessId, startDate, endDate || undefined);
                setLogs(fresh);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, [startDate, endDate, businessId, isLoaded]);

    /* ── derived stats ── */
    const totalYield = logs.reduce((s, l) => s + l.quantity, 0);
    const totalBoxes = logs.reduce((s, l) => s + (l.boxes || 0), 0);
    const uniqueWorkers = new Set(logs.map(l => l.workerId)).size;
    const uniqueArticles = new Set(logs.map(l => articleKey(l))).size;

    /* ── filtered logs ── */
    const filteredLogs = useMemo(() =>
        logs.filter(l =>
            l.articleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (employees.find(e => e.id === l.workerId)?.name || 'Manager').toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [logs, searchQuery, employees]
    );

    /* ── date range for chart ── */
    const dateRange = useMemo(() => {
        try {
            const s = parseISO(startDate);
            const e = endDate ? parseISO(endDate) : s;
            return e >= s ? eachDayOfInterval({ start: s, end: e }) : [s];
        } catch { return [new Date()]; }
    }, [startDate, endDate]);

    /* ── chart groups: keyed by article (id or name) ── */
    const chartGroups = useMemo(() => {
        const map: Record<string, {
            articleName: string;
            daily: Record<string, any[]>;
            firstDayIdx: number;
            lastDayIdx: number;
        }> = {};

        filteredLogs.forEach(log => {
            const key = articleKey(log);
            if (!map[key]) map[key] = { articleName: log.articleName, daily: {}, firstDayIdx: Infinity, lastDayIdx: -Infinity };
            const day = format(new Date(log.createdAt), 'yyyy-MM-dd');
            if (!map[key].daily[day]) map[key].daily[day] = [];
            map[key].daily[day].push(log);
        });

        // compute first/last day indices within dateRange
        const groups = Object.entries(map).map(([key, val]) => {
            let firstIdx = Infinity, lastIdx = -1;
            dateRange.forEach((date, i) => {
                const dk = format(date, 'yyyy-MM-dd');
                if (val.daily[dk]) { if (i < firstIdx) firstIdx = i; if (i > lastIdx) lastIdx = i; }
            });
            return { key, ...val, firstDayIdx: firstIdx === Infinity ? -1 : firstIdx, lastDayIdx: lastIdx };
        });

        return groups.sort((a, b) => a.articleName.localeCompare(b.articleName));
    }, [filteredLogs, dateRange]);

    /* ── max qty per day cell ── */
    const maxDayQty = useMemo(() => {
        let max = 0;
        chartGroups.forEach(g => Object.values(g.daily).forEach(dl => {
            const s = dl.reduce((a, l) => a + l.quantity, 0);
            if (s > max) max = s;
        }));
        return max;
    }, [chartGroups]);

    /* ── date navigation ── */
    const shiftDays = (n: number) => {
        const shift = (iso: string) => {
            const d = new Date(iso); d.setDate(d.getDate() + n);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        setStartDate(p => shift(p));
        if (endDate) setEndDate(p => shift(p));
    };

    /* ── exports ── */
    const exportCSV = () => {
        const csv = Papa.unparse(filteredLogs.map(l => ({
            Date: format(new Date(l.createdAt), 'yyyy-MM-dd'),
            Time: format(new Date(l.createdAt), 'HH:mm'),
            Manager: employees.find(e => e.id === l.workerId)?.name || 'Manager',
            Article: l.articleName, Boxes: l.boxes || 0, Quantity: l.quantity,
        })));
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
            download: `production_${startDate}.csv`,
        });
        a.click();
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(15); doc.text('Production Report', 14, 18);
        doc.setFontSize(9);
        doc.text(`Period: ${startDate}${endDate ? ' → ' + endDate : ''}   Yield: ${totalYield.toLocaleString()} pcs`, 14, 26);
        autoTable(doc, {
            head: [['Date', 'Time', 'Manager', 'Article', 'Boxes', 'Qty']],
            body: filteredLogs.map(l => [
                format(new Date(l.createdAt), 'MMM dd'), format(new Date(l.createdAt), 'HH:mm'),
                employees.find(e => e.id === l.workerId)?.name || 'Manager',
                l.articleName, l.boxes || 0, l.quantity.toLocaleString(),
            ]),
            startY: 32, styles: { fontSize: 7.5 }, headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save(`production_${startDate}.pdf`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this log?')) return;
        const res = await deleteProductionLog(id);
        if (res.success) { setLogs(p => p.filter(l => l.id !== id)); toast.success('Deleted'); }
        else toast.error(res.error || 'Failed');
    };

    /* ════════════════════ RENDER ════════════════════ */
    return (
        <div className="flex flex-col gap-4 pb-16 min-h-0">

            {/* ── TOP TOOLBAR ── */}
            <div className="flex flex-wrap items-center gap-2">

                {/* Date range picker */}
                <div className="flex items-center h-9 bg-white border border-slate-200 rounded-lg shadow-sm divide-x divide-slate-200 overflow-hidden text-sm">
                    <button onClick={() => shiftDays(-1)}
                        className="h-9 w-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                        <ChevronLeft size={14} />
                    </button>

                    <label className="h-9 flex items-center gap-1.5 px-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest select-none">From</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="text-[11px] font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer" />
                    </label>

                    <label className="h-9 flex items-center gap-1.5 px-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                        <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest select-none">To</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="text-[11px] font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer" />
                    </label>

                    {endDate && (
                        <button onClick={() => setEndDate('')}
                            className="h-9 px-2 text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors select-none">
                            ✕
                        </button>
                    )}

                    <button onClick={() => shiftDays(1)}
                        className="h-9 w-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>

                {isLoading && (
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 font-semibold">
                        <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        Loading…
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <Input placeholder="Article or manager…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-7 w-52 text-xs bg-white border-slate-200" />
                </div>

                {/* View toggle */}
                <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)}>
                    <TabsList className="h-9 bg-white border border-slate-200 shadow-sm p-0.5">
                        <TabsTrigger value="list"
                            className="h-8 px-3 text-[11px] gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-none">
                            <LayoutGrid size={12} /> List
                        </TabsTrigger>
                        <TabsTrigger value="chart"
                            className="h-8 px-3 text-[11px] gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-none">
                            <BarChart2 size={12} /> Chart
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-1.5 ml-auto">
                    <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 text-xs gap-1.5">
                        <FileJson size={12} /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportPDF} className="h-9 text-xs gap-1.5">
                        <Download size={12} /> PDF
                    </Button>
                </div>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { icon: Activity,      label: 'Total Yield',  value: totalYield.toLocaleString(), unit: 'pcs',     bg: 'bg-indigo-50', fg: 'text-indigo-600' },
                    { icon: ClipboardList, label: 'Total Boxes',  value: totalBoxes.toLocaleString(),  unit: 'boxes',   bg: 'bg-violet-50', fg: 'text-violet-600' },
                    { icon: Users,         label: 'Managers',     value: uniqueWorkers,                unit: 'active',  bg: 'bg-blue-50',   fg: 'text-blue-600' },
                    { icon: Package,       label: 'Articles',     value: uniqueArticles,               unit: 'tracked', bg: 'bg-emerald-50',fg: 'text-emerald-600' },
                ].map(({ icon: Icon, label, value, unit, bg, fg }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none ${bg} ${fg}`}>
                            <Icon size={15} />
                        </div>
                        <div>
                            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
                            <div className="text-[15px] font-black text-slate-800 leading-tight tabular-nums">
                                {value} <span className="text-[9px] font-normal text-slate-400">{unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── CONTENT ── */}
            <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 transition-opacity duration-150 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>

                {/* LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="overflow-auto max-h-[520px]">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <TableRow>
                                    {['Date / Time', 'Manager', 'Article', 'Boxes', 'Yield', ''].map(h => (
                                        <TableHead key={h}
                                            className={`text-[9px] font-bold uppercase tracking-wider text-slate-500 py-2.5 px-5
                                                ${h === 'Boxes' || h === 'Yield' ? 'text-right' : ''}
                                                ${h === '' ? 'w-10' : ''}`}>
                                            {h}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-xs">
                                            No logs found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.map(log => {
                                    const workerName = employees.find(e => e.id === log.workerId)?.name || 'Manager';
                                    return (
                                        <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                            <TableCell className="py-2 px-5 text-[11px] text-slate-500 whitespace-nowrap">
                                                {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                            </TableCell>
                                            <TableCell className="py-2 px-5 text-[11px] font-semibold text-slate-800">
                                                {workerName}
                                            </TableCell>
                                            <TableCell className="py-2 px-5">
                                                <span className="inline-flex items-center text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    {log.articleName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-5 text-right text-[11px] text-slate-600">{log.boxes}</TableCell>
                                            <TableCell className="py-2 px-5 text-right text-[11px] font-bold text-slate-900 tabular-nums">{log.quantity.toLocaleString()}</TableCell>
                                            <TableCell className="py-2 px-3">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}
                                                    className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50">
                                                    <Trash2 size={11} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* CHART VIEW — fills screen, no horizontal scroll */}
                {viewMode === 'chart' && (
                    <div className="w-full overflow-hidden">
                        <table className="w-full table-fixed border-collapse">
                            <colgroup>
                                {/* Article col: fixed 200px */}
                                <col style={{ width: 200 }} />
                                {/* Date cols: share remaining space equally */}
                                {dateRange.map((_, i) => <col key={i} />)}
                            </colgroup>

                            {/* Header */}
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-200 py-2.5 px-4 text-left">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Article</span>
                                    </th>
                                    {dateRange.map((date, i) => {
                                        const dk = format(date, 'yyyy-MM-dd');
                                        const isToday = dk === localToday();
                                        return (
                                            <th key={i} className={`py-2 text-center border-r border-slate-100 ${isToday ? 'bg-indigo-50/70' : ''}`}>
                                                <div className="flex flex-col items-center leading-none gap-0.5">
                                                    <span className="text-[8px] text-slate-400 uppercase font-semibold">{format(date, 'EEE')}</span>
                                                    <span className={`text-[13px] font-black tabular-nums ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                        {format(date, 'd')}
                                                    </span>
                                                    <span className="text-[8px] text-slate-300 uppercase">{format(date, 'MMM')}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            {/* Body */}
                            <tbody className="divide-y divide-slate-100">
                                {chartGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={dateRange.length + 1}
                                            className="text-center text-slate-400 text-xs py-20">
                                            No data for the selected period.
                                        </td>
                                    </tr>
                                ) : chartGroups.map((group, gIdx) => {
                                    const rowTotal = Object.values(group.daily).flat().reduce((s, l) => s + l.quantity, 0);
                                    return (
                                        <tr key={gIdx} className="hover:bg-slate-50/40 transition-colors">
                                            {/* Article label (sticky) */}
                                            <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-4 py-1.5 align-middle">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-none" />
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] font-bold text-slate-800 truncate uppercase leading-tight">{group.articleName}</div>
                                                        <div className="text-[8px] text-slate-400 tabular-nums">{rowTotal.toLocaleString()} pcs</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Candle / ghost / empty per date */}
                                            {dateRange.map((date, dIdx) => {
                                                const dk = format(date, 'yyyy-MM-dd');
                                                const dayLogs = group.daily[dk] || [];
                                                const hasData = dayLogs.length > 0;
                                                const inRange = dIdx >= group.firstDayIdx && dIdx <= group.lastDayIdx;
                                                const mode: CellMode = hasData ? 'active' : inRange ? 'ghost' : 'empty';
                                                const isToday = dk === localToday();
                                                // isFirst/isLast for connector rail
                                                const isFirstActive = dIdx === group.firstDayIdx;
                                                const isLastActive = dIdx === group.lastDayIdx;

                                                return (
                                                    <td key={dIdx}
                                                        className={`p-0 border-r border-slate-100 align-middle ${isToday ? 'bg-indigo-50/20' : ''}`}>
                                                        <CandleCell
                                                            dayLogs={dayLogs}
                                                            employees={employees}
                                                            maxQty={maxDayQty}
                                                            mode={mode}
                                                            isFirst={isFirstActive}
                                                            isLast={isLastActive}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Legend */}
            {viewMode === 'chart' && chartGroups.length > 0 && (
                <div className="flex items-center gap-5 text-[9px] text-slate-500 font-medium flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-px h-1.5 bg-indigo-500/50 rounded" />
                            <div className="w-3.5 h-3 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-[2px]" />
                            <div className="w-px h-1.5 bg-indigo-500/50 rounded" />
                        </div>
                        Multi-entry candle (with wicks)
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2.5 bg-gradient-to-b from-indigo-300 to-indigo-500 rounded-[2px]" />
                        Single entry
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                            <div className="w-3 h-px bg-indigo-200" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                            <div className="w-3 h-px bg-indigo-200" />
                        </div>
                        Ghost connector (no entry this day)
                    </div>
                    <span className="text-slate-400 italic ml-auto">Hover candles for manager breakdown</span>
                </div>
            )}

            <style jsx global>{`
                input[type="date"]::-webkit-calendar-picker-indicator {
                    opacity: 0.4; cursor: pointer; margin-left: 2px;
                }
            `}</style>
        </div>
    );
}
