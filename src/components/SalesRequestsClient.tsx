'use client';

import React, { useState } from 'react';
import { ClipboardList, Package, Clock, User, ChevronLeft, ChevronRight, FileText, Download, CheckCircle2, Search, X, Trash2, Edit3, SlidersHorizontal, Plus, Minus, Undo2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { deleteRequest, updateRequestStatus, updateRequest } from '@/app/actions/salesOps';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const PERIODS = [
    { label: 'Today', getDates: () => { const t = new Date().toISOString().split('T')[0]; return [t, t]; } },
    { label: 'Week', getDates: () => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - 6); return [start.toISOString().split('T')[0], now.toISOString().split('T')[0]]; } },
    { label: 'Month', getDates: () => { const now = new Date(); return [new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]]; } },
    { label: 'All', getDates: () => ['', ''] },
];

interface SalesRequestsClientProps {
    initialRequests: any[];
}

export default function SalesRequestsClient({ initialRequests }: SalesRequestsClientProps) {
    const [requests, setRequests] = useState<any[]>(initialRequests);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const now = new Date();
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    const [activePeriod, setActivePeriod] = useState('Month');
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [editingReq, setEditingReq] = useState<any>(null);
    const [editParams, setEditParams] = useState({ quantity: 1, productName: '', notes: '' });

    const applyPeriod = (label: string) => {
        const period = PERIODS.find(p => p.label === label);
        if (!period) return;
        const [s, e] = period.getDates();
        setStartDate(s);
        setEndDate(e);
        setActivePeriod(label);
    };

    const filteredRequests = requests.filter((req: any) => {
        const dDate = new Date(req.createdAt).toISOString().split('T')[0];
        const matchesDate = (!startDate || dDate >= startDate) && (!endDate || dDate <= endDate);
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
        const matchesSearch = !searchQuery || 
            (req.product?.name || req.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.requestedBy?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesStatus && matchesSearch;
    });

    const pendingCount = filteredRequests.filter(r => r.status === 'PENDING').length;

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Inventory Requisitions Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 30);
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

        doc.save(`Requisitions_${startDate}_to_${endDate}.pdf`);
        toast.success('Report Exported Successfully');
    };

    const handleEditStart = (req: any) => {
        setEditingReq(req);
        setEditParams({
            quantity: req.quantity || 1,
            productName: req.product?.name || req.productName || '',
            notes: req.notes || ''
        });
    };

    const handleEditSave = async () => {
        if (!editingReq) return;
        setIsProcessing(editingReq.id);
        const res = await updateRequest(editingReq.id, editParams);
        setIsProcessing(null);
        if (res.success) {
            toast.success('Requisition updated');
            setRequests(requests.map(r => r.id === editingReq.id ? { ...r, quantity: editParams.quantity, productName: editParams.productName, notes: editParams.notes } : r));
            setEditingReq(null);
        } else {
            toast.error(res.error || 'Update failed');
        }
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

                <div className="flex flex-wrap items-center gap-2">
                    {PERIODS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPeriod(p.label)}
                            className={cn(
                                "py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activePeriod === p.label ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button onClick={() => setShowFilters(!showFilters)} className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all", showFilters ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                        <SlidersHorizontal size={14} />
                    </button>
                    <button 
                        onClick={generatePDF}
                        className="flex items-center gap-2 px-4 h-10 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
                    >
                        <FileText size={14} /> Export
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">From</label>
                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePeriod(''); }} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To</label>
                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePeriod(''); }} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1 sm:ml-auto w-full sm:w-auto min-w-[150px]">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                            <option value="ALL">All Requisitions</option>
                            <option value="PENDING">In Process</option>
                            <option value="APPROVED">Approved</option>
                        </select>
                    </div>
                </div>
            )}

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
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider w-[240px]">Time & Item</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider hidden sm:table-cell">Requested By</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Status</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-right w-[100px]">Qty</TableHead>
                                        <TableHead className="w-[160px] text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((req: any) => (
                                        <TableRow key={req.id} className="group hover:bg-slate-50 transition-colors">
                                            <TableCell className="align-top py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Clock size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{req.product?.name || req.productName || 'Unnamed Item'}</h4>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top py-4 hidden sm:table-cell">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={12} className="text-blue-400" />
                                                    <span className="text-xs font-bold text-slate-700 uppercase">{req.requestedBy || 'Manager'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <span className={cn(
                                                    "text-[9px] font-black px-2.5 py-1 rounded-md border uppercase tracking-widest whitespace-nowrap inline-block",
                                                    req.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100"
                                                )}>
                                                    {req.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-right">
                                                <span className="text-base font-black text-slate-900 tabular-nums bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 italic shadow-sm">
                                                    x{req.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {req.status === 'PENDING' ? (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                                            disabled={isProcessing === req.id}
                                                            className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-200 disabled:opacity-50"
                                                            title="Process"
                                                        >
                                                            {isProcessing === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(req.id, 'PENDING')}
                                                            disabled={isProcessing === req.id}
                                                            className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg font-bold hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-200 disabled:opacity-50"
                                                            title="Revert Process"
                                                        >
                                                            {isProcessing === req.id ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEditStart(req)}
                                                        disabled={isProcessing === req.id}
                                                        className="w-8 h-8 flex items-center justify-center bg-white text-slate-500 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-200 shadow-sm disabled:opacity-50"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(req.id)}
                                                        disabled={isProcessing === req.id}
                                                        className="w-8 h-8 flex items-center justify-center bg-white text-slate-500 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-200 shadow-sm disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* EDIT DIALOG */}
            <Dialog open={!!editingReq} onOpenChange={(open) => !open && setEditingReq(null)}>
                <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase italic">Edit Requisition</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Modify request details</DialogDescription>
                        </div>
                        <button onClick={() => setEditingReq(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 active:scale-95 transition-all shadow-sm">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-6 space-y-5 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
                            <input 
                                type="text"
                                value={editParams.productName}
                                onChange={(e) => setEditParams({...editParams, productName: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                            <div className="flex items-center h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden w-32">
                                <button type="button" onClick={() => setEditParams({...editParams, quantity: Math.max(1, editParams.quantity - 1)})} className="w-10 h-full flex items-center justify-center text-slate-500 active:bg-slate-200">
                                    <Minus size={14} />
                                </button>
                                <input type="number" value={editParams.quantity} onChange={(e) => setEditParams({...editParams, quantity: parseInt(e.target.value) || 1})} className="flex-1 bg-transparent text-center text-sm font-black text-slate-900 outline-none w-full" />
                                <button type="button" onClick={() => setEditParams({...editParams, quantity: editParams.quantity + 1})} className="w-10 h-full flex items-center justify-center text-slate-500 active:bg-slate-200">
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
                            <textarea 
                                value={editParams.notes}
                                onChange={(e) => setEditParams({...editParams, notes: e.target.value})}
                                rows={3}
                                placeholder="Additional context..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all resize-none"
                            />
                        </div>
                        
                        <button 
                            onClick={handleEditSave}
                            disabled={isProcessing === editingReq?.id}
                            className="w-full h-12 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 mt-4"
                        >
                            {isProcessing === editingReq?.id ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
