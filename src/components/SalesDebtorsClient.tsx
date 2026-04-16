'use client';

import React, { useState } from 'react';
import { Landmark, Search, Filter, Download, UserMinus, Phone, Calendar, Clock, ArrowUpRight, ChevronLeft, ChevronRight, FileText, X, Trash2, Activity, Rocket, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { deleteDebtor, recordPayment } from '@/app/actions/salesOps';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface SalesDebtorsClientProps {
    initialDebtors: any[];
    currencySymbol?: string;
}

export default function SalesDebtorsClient({ initialDebtors, currencySymbol = 'ALL' }: SalesDebtorsClientProps) {
    const [debtors, setDebtors] = useState<any[]>(initialDebtors);
    
    // Dates defaults to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState<string>(firstDay);
    const [endDate, setEndDate] = useState<string>(lastDay);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // Settlement & Detail Dialog States
    const [settlingDebtor, setSettlingDebtor] = useState<any | null>(null);
    const [viewingDebtor, setViewingDebtor] = useState<any | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>('');

    const filteredDebtors = debtors.filter((debtor: any) => {
        const dDate = new Date(debtor.createdAt).toISOString().split('T')[0];
        const matchesDate = (!startDate || dDate >= startDate) && (!endDate || dDate <= endDate);
        const matchesStatus = statusFilter === 'ALL' || debtor.status === statusFilter;
        const matchesSearch = !searchQuery || 
            debtor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            debtor.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesStatus && matchesSearch;
    });

    const totalAmount = filteredDebtors.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPaid = filteredDebtors.reduce((sum, d) => sum + Number(d.paidAmount), 0);
    const balance = totalAmount - totalPaid;

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('DEBTORS REGISTRY: SYSTEM EXTRACT', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`EXTRACT PERIOD: ${startDate} TO ${endDate}`, 14, 30);
        doc.text(`STATUS FILTER: ${statusFilter}`, 14, 35);
        doc.text(`AGGREGATE BALANCE: ${currencySymbol} ${balance.toLocaleString()}`, 14, 40);

        const tableData = filteredDebtors.map(d => [
            d.name.toUpperCase(),
            d.status,
            d.phone || 'NO_CONTACT',
            `${currencySymbol} ${Number(d.amount).toLocaleString()}`,
            `${currencySymbol} ${Number(d.paidAmount).toLocaleString()}`,
            `${currencySymbol} ${(Number(d.amount) - Number(d.paidAmount)).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['ENTITY_NAME', 'STATUS', 'COMM_CHANNEL', 'DEBIT_INIT', 'SETTLED', 'NET_DUE']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, font: 'courier' }
        });

        doc.save(`DEBT_EXTRACT_${startDate}_${endDate}.pdf`);
        toast.success('REGISTRY EXPORTED: HASH VALIDATED');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ARCHIVE DEBTOR ENTITY? THIS ACTION CANNOT BE REVERSED.')) return;
        setIsProcessing(id);
        const res = await deleteDebtor(id);
        setIsProcessing(null);
        if (res.success) {
            toast.success('ENTITY ARCHIVED');
            setDebtors(debtors.filter(d => d.id !== id));
            if (viewingDebtor?.id === id) setViewingDebtor(null);
        } else {
            toast.error(res.error || 'ARCHIVE FAILED');
        }
    };

    const handleConfirmPayment = async () => {
        if (!settlingDebtor || !paymentAmount || isNaN(Number(paymentAmount))) {
            toast.error('INVALID_SETTLEMENT_VALUE');
            return;
        }
        
        const amount = Number(paymentAmount);
        const debtorId = settlingDebtor.id;
        setIsProcessing(debtorId);
        
        const res = await recordPayment(debtorId, amount);
        setIsProcessing(null);

        if (res.success) {
            toast.success('SETTLEMENT_SYNCHRONIZED');
            setDebtors(debtors.map(d => {
                if (d.id === debtorId) {
                    const newPaid = Number(d.paidAmount) + amount;
                    const total = Number(d.amount);
                    let status = 'PARTIAL';
                    if (newPaid >= total) status = 'PAID';
                    if (newPaid <= 0) status = 'UNPAID';
                    return { ...d, paidAmount: newPaid, status };
                }
                return d;
            }));
            
            // Sync with Detail View if open
            if (viewingDebtor?.id === debtorId) {
                setViewingDebtor((prev: any) => {
                    const newPaid = Number(prev.paidAmount) + amount;
                    const total = Number(prev.amount);
                    let status = 'PARTIAL';
                    if (newPaid >= total) status = 'PAID';
                    return { ...prev, paidAmount: newPaid, status };
                });
            }
            
            setSettlingDebtor(null);
            setPaymentAmount('');
        } else {
            toast.error(res.error || 'SETTLEMENT_REJECTED');
        }
    };

    return (
        <div className="space-y-6">
            {/* ── HEADER PANEL: VIBRANT LIGHT PRODUCTION EASE */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-indigo-100/30 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-100/50 rounded-full blur-[60px] opacity-50" />
                
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Landmark size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                DEBTORS <span className="text-indigo-600">CENTRAL</span>
                            </h1>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 italic flex items-center gap-1.5 leading-none">
                             <Activity size={10} className="text-indigo-500 animate-pulse" /> NETWORK_SYNC
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
                    <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-3">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black text-slate-900 outline-none cursor-pointer uppercase italic p-0"
                            />
                            <div className="w-px h-4 bg-slate-200" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black text-slate-900 outline-none cursor-pointer uppercase italic p-0"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={generatePDF}
                        className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Download size={14} strokeWidth={3} /> EXPORT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ── ANALYTICS CORE */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-100/10">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2 italic">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> AGGREGATE
                        </h3>
                        <div className="space-y-3">
                            <p className="text-3xl font-black italic text-slate-900 tracking-tighter leading-none">
                                {currencySymbol} {balance.toLocaleString()}
                            </p>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${totalAmount > 0 ? (totalPaid/totalAmount)*100 : 0}%` }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-[2rem] border border-white shadow-lg space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} strokeWidth={3} />
                            <input 
                                type="text"
                                placeholder="QUERY..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-900 outline-none focus:border-indigo-600 transition-all uppercase placeholder:text-slate-200 italic"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {['ALL', 'UNPAID', 'PARTIAL', 'PAID'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic border",
                                        statusFilter === s 
                                            ? "bg-indigo-600 text-white border-transparent" 
                                            : "bg-white text-slate-400 border-slate-100 hover:text-indigo-600"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── HIGH DENSITY REGISTRY */}
                <div className="lg:col-span-3">
                    {filteredDebtors.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-white shadow-xl h-[400px] flex flex-col items-center justify-center text-center p-8">
                            <UserMinus size={32} className="text-slate-200 mb-4" />
                            <h2 className="text-lg font-black text-slate-900 italic uppercase">NULL_RECORDS</h2>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ENTITY_NODE</TableHead>
                                        <TableHead className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">VALUATION</TableHead>
                                        <TableHead className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">CMDS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDebtors.map((debtor: any) => (
                                        <TableRow 
                                            key={debtor.id} 
                                            onClick={() => setViewingDebtor(debtor)}
                                            className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                        >
                                            <TableCell className="px-6 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black italic shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        {debtor.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 uppercase italic text-xs tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                                            {debtor.name}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                                <Phone size={10} className="text-indigo-500" /> {debtor.phone}
                                                            </div>
                                                            <div className="text-[8px] text-slate-300 font-bold uppercase tracking-widest leading-none">
                                                                {new Date(debtor.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-3 text-right">
                                                <div className="font-black text-slate-950 tabular-nums text-sm italic tracking-tighter leading-none mb-1">
                                                    {currencySymbol} {(Number(debtor.amount) - Number(debtor.paidAmount)).toLocaleString()}
                                                </div>
                                                <div className={cn(
                                                    "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block border",
                                                    debtor.status === 'UNPAID' ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                                    debtor.status === 'PARTIAL' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                )}>
                                                    {debtor.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setSettlingDebtor(debtor);
                                                            setPaymentAmount((Number(debtor.amount) - Number(debtor.paidAmount)).toString());
                                                        }}
                                                        className="h-9 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                                                    >
                                                        SETTLE
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(debtor.id)}
                                                        className="h-9 w-9 flex items-center justify-center bg-white text-slate-200 border border-slate-100 rounded-lg hover:text-rose-600 hover:border-rose-100 transition-all"
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

            {/* ── DEBTOR DETAIL DIALOG */}
            <Dialog open={!!viewingDebtor} onOpenChange={(open) => !open && setViewingDebtor(null)}>
                <DialogContent className="max-w-2xl bg-white border-none p-0 overflow-hidden rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Entity Details: {viewingDebtor?.name}</DialogTitle>
                        <DialogDescription>Full financial and administrative profile of the debtor.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-slate-900 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black italic text-3xl border border-white/20">
                                    {viewingDebtor?.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">{viewingDebtor?.name}</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <Phone size={12} className="text-indigo-400" /> {viewingDebtor?.phone || 'NO_CHN'}
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            JOINED_{new Date(viewingDebtor?.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border",
                                viewingDebtor?.status === 'UNPAID' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                                viewingDebtor?.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                                {viewingDebtor?.status}_NODE
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        {/* Financial Matrix */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">INITIAL_DEBIT</p>
                                <p className="text-2xl font-black text-slate-900 italic tracking-tighter tabular-nums">
                                    {currencySymbol} {Number(viewingDebtor?.amount || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 shadow-sm">
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic">SETTLED_VAL</p>
                                <p className="text-2xl font-black text-indigo-600 italic tracking-tighter tabular-nums">
                                    {currencySymbol} {Number(viewingDebtor?.paidAmount || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm">
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3 italic">OUTSTANDING</p>
                                <p className="text-2xl font-black text-rose-600 italic tracking-tighter tabular-nums">
                                    {currencySymbol} {(Number(viewingDebtor?.amount || 0) - Number(viewingDebtor?.paidAmount || 0)).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Administrative Notes */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                                    <FileText size={16} />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">GOVERNANCE_NOTES</h4>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 min-h-[120px] shadow-inner">
                                {viewingDebtor?.notes ? (
                                    <p className="text-sm font-bold text-slate-600 italic leading-relaxed">{viewingDebtor.notes}</p>
                                ) : (
                                    <p className="text-[10px] font-black text-slate-300 uppercase italic">NO_RECORDS_FOUND_IN_NODE_METADATA</p>
                                )}
                            </div>
                        </div>

                        {/* Action Command */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSettlingDebtor(viewingDebtor);
                                    setPaymentAmount((Number(viewingDebtor.amount) - Number(viewingDebtor.paidAmount)).toString());
                                    setViewingDebtor(null);
                                }}
                                className="flex-1 h-16 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Zap size={18} className="relative z-10" />
                                <span className="relative z-10">INITIATE_SETTLEMENT</span>
                            </button>
                            <button
                                onClick={() => setViewingDebtor(null)}
                                className="h-16 px-10 bg-white text-slate-400 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── SETTLEMENT DIALOG: PREMIUM LOGISTICS GRADE */}
            <Dialog open={!!settlingDebtor} onOpenChange={(o) => !o && setSettlingDebtor(null)}>
                <DialogContent className="max-w-xl p-0 overflow-hidden bg-slate-50 border-none rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Logistics Settlement</DialogTitle>
                        <DialogDescription>Record a payment for {settlingDebtor?.name}.</DialogDescription>
                    </DialogHeader>

                    <div className="relative">
                        {/* Visual Header */}
                        <div className="bg-indigo-600 p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 blur-2xl -ml-16 -mb-16" />
                            
                            <div className="relative z-10 text-left space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center ring-1 ring-white/30 shadow-2xl">
                                        <Zap size={28} className="text-white fill-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Logistics Settlement</h2>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mt-2">DEBT_CLEARANCE_PROTOCOL</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="p-10 space-y-8">
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-100/20">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1 italic">ENTITY_SUBJECT</p>
                                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{settlingDebtor?.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1 italic">NET_LIABILITY</p>
                                        <p className="text-xl font-black text-indigo-600 italic tracking-tight">
                                            {currencySymbol} {settlingDebtor ? (Number(settlingDebtor.amount) - Number(settlingDebtor.paidAmount)).toLocaleString() : 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic flex items-center gap-2">
                                        <Rocket size={12} className="text-indigo-600" /> SETTLEMENT_VALUATION
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">{currencySymbol}</div>
                                        <input 
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="w-full pl-16 pr-8 py-8 bg-slate-50 border-2 border-slate-100 rounded-3xl text-4xl font-black text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all tabular-nums italic"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={!paymentAmount || isProcessing === settlingDebtor?.id}
                                    className="h-20 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CheckCircle2 size={24} className="relative z-10" />
                                    <span className="relative z-10">{isProcessing === settlingDebtor?.id ? 'PROCESSING_LOGS...' : 'FINALIZE_SETTLEMENT'}</span>
                                </button>
                                
                                <button
                                    onClick={() => setSettlingDebtor(null)}
                                    className="h-16 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95"
                                >
                                    ABORT_OPERATION
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
