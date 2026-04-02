'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, FileText, Search, Download, FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { deleteProductionLog, getAdminDailyProductionLogs } from '@/app/actions/production';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface AdminProductionTrackingClientProps {
    initialLogs: any[];
    employees: any[];
    businessId?: string;
}

export default function AdminProductionTrackingClient({ initialLogs, employees, businessId }: AdminProductionTrackingClientProps) {
    const [logs, setLogs] = useState<any[]>(initialLogs);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const fetchLogs = async () => {
            const freshLogs = await getAdminDailyProductionLogs(businessId, selectedDate);
            setLogs(freshLogs);
        };
        fetchLogs();
    }, [selectedDate, businessId, isLoaded]);

    const totalBoxes = logs.reduce((sum, l) => sum + (l.boxes || 0), 0);
    const totalYield = logs.reduce((sum, l) => sum + l.quantity, 0);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this log entry?")) return;
        const res = await deleteProductionLog(id);
        if (res.success) {
            setLogs(logs.filter(l => l.id !== id));
            toast.success("Log deleted");
        } else {
            toast.error(res.error || "Failed to delete");
        }
    };

    const filteredLogs = logs.filter(l => 
        l.articleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employees.find(e => e.id === l.workerId)?.name || 'Manager').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToCSV = () => {
        const data = filteredLogs.map(l => ({
            Date: format(new Date(selectedDate), 'yyyy-MM-dd'),
            Time: format(new Date(l.createdAt), 'HH:mm:ss'),
            Responsible: employees.find(e => e.id === l.workerId)?.name || 'Manager',
            Article: l.articleName,
            Boxes: l.boxes || 0,
            Quantity: l.quantity
        }));
        
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Production_Report_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text('Production Output Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Date: ${format(new Date(selectedDate), 'PPPP')}`, 14, 30);
        doc.text(`Total Yield: ${totalYield.toLocaleString()} pcs | Total Boxes: ${totalBoxes}`, 14, 36);

        const tableData = filteredLogs.map(l => [
            format(new Date(l.createdAt), 'HH:mm:ss'),
            employees.find(e => e.id === l.workerId)?.name || 'Manager',
            l.articleName,
            l.boxes || 0,
            l.quantity.toLocaleString()
        ]);

        autoTable(doc, {
            head: [['Time', 'Responsible', 'Article', 'Boxes', 'Quantity']],
            body: tableData,
            startY: 45,
            styles: { fontSize: 8, font: 'helvetica' },
            headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
        });

        doc.save(`Production_Report_${selectedDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Boxes</div>
                        <div className="text-3xl font-black text-slate-900 leading-none mt-2 tabular-nums">
                            {totalBoxes.toLocaleString()}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Yield</div>
                        <div className="text-3xl font-black text-indigo-600 leading-none mt-2 tabular-nums">
                            {totalYield.toLocaleString()} <span className="text-xs opacity-60">pcs</span>
                        </div>
                    </div>
                    <Activity className="absolute -right-4 -bottom-4 text-slate-50 w-24 h-24 rotate-12" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Display Date</div>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner w-full justify-between">
                        <button 
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600 active:scale-90"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        <div className="flex-1 px-2 flex items-center justify-center gap-2 min-w-0">
                            <CalendarIcon size={14} className="text-indigo-600 shrink-0" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-[13px] font-black text-slate-900 border-none outline-none cursor-pointer focus:ring-0 uppercase tracking-tight w-full text-center"
                            />
                        </div>

                        <button 
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600 active:scale-90"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List & Search */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-indigo-600" size={16} />
                        <div>
                            <h2 className="text-[11px] font-black tracking-widest uppercase text-slate-700">Production Output Logs</h2>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{filteredLogs.length} Records for {format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text"
                                placeholder="FILTER BY ARTICLE OR MANAGER..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:border-indigo-600 outline-none transition-all uppercase tracking-tight shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                            >
                                <FileJson size={14} /> Excel/CSV
                            </button>
                            <button 
                                onClick={exportToPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                            >
                                <Download size={14} /> Export PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/20">
                                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Responsible</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Article</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Boxes</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</th>
                                <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Opt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log: any) => {
                                const workerName = employees.find(e => e.id === log.workerId)?.name || 'Manager';
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3">
                                            <span className="text-[11px] font-black text-slate-600 tabular-nums">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase">{workerName}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                {log.articleName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-xs font-black text-slate-900 tabular-nums">{log.boxes}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="inline-flex items-center justify-end font-mono">
                                                <span className="text-xs font-black text-emerald-600 tabular-nums">{log.quantity.toLocaleString()}</span>
                                                <span className="text-[8px] text-emerald-600/70 uppercase tracking-widest ml-1 font-sans">pcs</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button 
                                                onClick={() => handleDelete(log.id)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors mx-auto"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <FileText size={32} className="text-slate-100 mx-auto mb-3" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">No output logs found for this filter</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
