'use client';

import React, { useState } from 'react';
import { ClipboardList, Package, Clock, User, ChevronLeft, ChevronRight, FileText, Download, CheckCircle2, Search, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { deleteRequest, updateRequestStatus } from '@/app/actions/salesOps';

interface SalesRequestsClientProps {
    initialRequests: any[];
}

export default function SalesRequestsClient({ initialRequests }: SalesRequestsClientProps) {
    const [requests, setRequests] = useState<any[]>(initialRequests);
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const shiftDate = (days: number) => {
        const current = dateFilter ? new Date(dateFilter) : new Date();
        current.setDate(current.getDate() + days);
        setDateFilter(current.toISOString().split('T')[0]);
    };

    const filteredRequests = requests.filter((req: any) => {
        const matchesDate = !dateFilter || new Date(req.createdAt).toISOString().split('T')[0] === dateFilter;
        const matchesSearch = !searchQuery || 
            (req.product?.name || req.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.requestedBy?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesSearch;
    });

    const pendingCount = filteredRequests.filter(r => r.status === 'PENDING').length;

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Inventory Requisitions Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report Date: ${dateFilter || 'All'}`, 14, 30);
        doc.text(`Total Requests: ${filteredRequests.length}`, 14, 36);

        const tableData = filteredRequests.map(r => [
            r.product?.name || r.productName || 'N/A',
            r.quantity.toString(),
            r.status,
            r.requestedBy || 'N/A',
            new Date(r.createdAt).toLocaleTimeString()
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Product', 'Qty', 'Status', 'Requested By', 'Time']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`Requisitions_${dateFilter || 'Export'}.pdf`);
        toast.success('Report Exported Successfully');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this requisition permanently?')) return;
        setIsProcessing(id);
        const res = await deleteRequest(id);
        setIsProcessing(null);
        if (res.success) {
            toast.success('Requisition deleted');
            setRequests(requests.filter(r => r.id !== id));
        } else {
            toast.error(res.error || 'Failed to delete');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setIsProcessing(id);
        const res = await updateRequestStatus(id, newStatus);
        setIsProcessing(null);
        if (res.success) {
            toast.success(`Status updated to ${newStatus}`);
            setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } else {
            toast.error(res.error || 'Failed to update');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <ClipboardList size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Items Requisitions</h1>
                        <p className="text-[10px] md:text-sm text-slate-500 font-medium tracking-tight uppercase italic opacity-70">Inventory replenishment monitoring</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-blue-600">
                            <ChevronLeft size={18} />
                        </button>
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer w-32 uppercase italic p-0"
                        />
                        <button onClick={() => shiftDate(1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-blue-600">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={generatePDF}
                        className="flex items-center justify-center gap-2 px-6 h-12 lg:h-11 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                        <FileText size={14} /> Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-200 text-white">
                        <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-4 italic opacity-80">Backlog Summary</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-blue-100">Status Active</span>
                                <span className="text-2xl font-black italic">{pendingCount}</span>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(pendingCount / (filteredRequests.length || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Search article..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col items-center justify-center text-center p-12">
                            <Package size={48} className="text-slate-200 mb-4" />
                            <h2 className="text-lg font-bold text-slate-900 italic uppercase italic">Nothing to fulfill</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">No requisitions detected for this timeframe</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredRequests.map((req: any) => (
                                <div key={req.id} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-blue-300 transition-all group gap-4">
                                    <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-slate-100 shrink-0">
                                            <Package size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic leading-none truncate">{req.product?.name || req.productName || 'Unnamed Item'}</h4>
                                                <span className={cn(
                                                    "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                                    req.status === 'PENDING' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100"
                                                )}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                <div className="flex items-center gap-1.5"><User size={10} className="text-blue-400" /> {req.requestedBy || 'Manager'}</div>
                                                <div className="flex items-center gap-1.5" suppressHydrationWarning><Clock size={10} className="text-slate-300" /> {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                                        <div className="text-left sm:text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 opacity-60 italic">Quantity Reqd</p>
                                            <p className="text-2xl font-black text-slate-900 leading-none italic">x{req.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {req.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                                    disabled={isProcessing === req.id}
                                                    className="h-11 px-4 flex items-center justify-center bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm hover:shadow-lg disabled:opacity-50"
                                                >
                                                    {isProcessing === req.id ? '...' : 'Process'}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(req.id)}
                                                disabled={isProcessing === req.id}
                                                className="h-11 w-11 flex items-center justify-center bg-white text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm hover:shadow-lg border border-slate-100 disabled:opacity-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
