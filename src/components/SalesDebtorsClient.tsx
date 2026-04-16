'use client';

import React, { useState } from 'react';
import { Landmark, Search, Filter, Download, UserMinus, Phone, Calendar, Clock, ArrowUpRight, ChevronLeft, ChevronRight, FileText, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { deleteDebtor, recordPayment } from '@/app/actions/salesOps';

interface SalesDebtorsClientProps {
    initialDebtors: any[];
    currencySymbol?: string;
}

export default function SalesDebtorsClient({ initialDebtors, currencySymbol = '$' }: SalesDebtorsClientProps) {
    const [debtors, setDebtors] = useState<any[]>(initialDebtors);
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const shiftDate = (days: number) => {
        const current = dateFilter ? new Date(dateFilter) : new Date();
        current.setDate(current.getDate() + days);
        setDateFilter(current.toISOString().split('T')[0]);
    };

    const filteredDebtors = debtors.filter((debtor: any) => {
        const matchesDate = !dateFilter || new Date(debtor.createdAt).toISOString().split('T')[0] === dateFilter;
        const matchesSearch = !searchQuery || 
            debtor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            debtor.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesSearch;
    });

    const totalAmount = filteredDebtors.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPaid = filteredDebtors.reduce((sum, d) => sum + Number(d.paidAmount), 0);
    const balance = totalAmount - totalPaid;

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Debtors Registry Statement', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report Date: ${dateFilter || 'All'}`, 14, 30);
        doc.text(`Total Balance Outstanding: ${currencySymbol}${balance.toLocaleString()}`, 14, 36);

        const tableData = filteredDebtors.map(d => [
            d.name,
            d.status,
            d.phone || 'N/A',
            `${currencySymbol}${Number(d.amount).toLocaleString()}`,
            `${currencySymbol}${Number(d.paidAmount).toLocaleString()}`,
            `${currencySymbol}${(Number(d.amount) - Number(d.paidAmount)).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Profile', 'Status', 'Contact', 'Total', 'Paid', 'Balance']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [225, 29, 72] } // Rose-600 for debt focus
        });

        doc.save(`Debtors_Report_${dateFilter || 'Export'}.pdf`);
        toast.success('Registry Exported Successfully');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this debtor profile?')) return;
        setIsProcessing(id);
        const res = await deleteDebtor(id);
        setIsProcessing(null);
        if (res.success) {
            toast.success('Profile deleted');
            setDebtors(debtors.filter(d => d.id !== id));
        } else {
            toast.error(res.error || 'Failed to delete');
        }
    };

    const handlePayment = async (id: string) => {
        const amountStr = prompt('Enter payment amount:');
        if (!amountStr || isNaN(Number(amountStr))) return;
        
        const amount = Number(amountStr);
        setIsProcessing(id);
        const res = await recordPayment(id, amount);
        setIsProcessing(null);

        if (res.success) {
            toast.success('Payment recorded');
            setDebtors(debtors.map(d => {
                if (d.id === id) {
                    const newPaid = Number(d.paidAmount) + amount;
                    const total = Number(d.amount);
                    let status = 'PARTIAL';
                    if (newPaid >= total) status = 'PAID';
                    if (newPaid <= 0) status = 'UNPAID';
                    return { ...d, paidAmount: newPaid, status };
                }
                return d;
            }));
        } else {
            toast.error(res.error || 'Failed to record payment');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <Landmark size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Debtors Central</h1>
                        <p className="text-[10px] md:text-sm text-slate-500 font-medium tracking-tight uppercase italic opacity-70">Registry of outstanding credit accounts</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-rose-600">
                            <ChevronLeft size={18} />
                        </button>
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer w-32 uppercase italic p-0"
                        />
                        <button onClick={() => shiftDate(1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-rose-600">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={generatePDF}
                        className="flex items-center justify-center gap-2 px-6 h-12 lg:h-11 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                    >
                        <FileText size={14} /> Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-rose-600">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Receivables Total</h3>
                        <div className="space-y-1">
                            <p className="text-3xl font-black italic text-rose-600 leading-none">{currencySymbol}{balance.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Balance in Domain</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Search name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-rose-500 transition-all"
                        />
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {filteredDebtors.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col items-center justify-center text-center p-12">
                            <UserMinus size={48} className="text-slate-200 mb-4" />
                            <h2 className="text-lg font-bold text-slate-900 italic uppercase">All Settled</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">No active debt found for this filter</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Debtor Profile</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance Due</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-medium">
                                        {filteredDebtors.map((debtor: any) => (
                                            <tr key={debtor.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-rose-50 group-hover:text-rose-600 transition-all border border-slate-100 italic">
                                                            {debtor.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 uppercase italic text-sm">{debtor.name}</div>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                                <Phone size={10} className="text-emerald-500" /> {debtor.phone || 'NO CONTACT'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="font-black text-slate-900 tabular-nums text-lg italic">{currencySymbol}{(Number(debtor.amount) - Number(debtor.paidAmount)).toLocaleString()}</div>
                                                    <div className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest",
                                                        debtor.status === 'UNPAID' ? "text-rose-500" : 
                                                        debtor.status === 'PARTIAL' ? "text-amber-500" : "text-emerald-500"
                                                    )}>{debtor.status}</div>
                                                </td>
                                                <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handlePayment(debtor.id)}
                                                        disabled={isProcessing === debtor.id}
                                                        className="h-10 px-4 flex items-center justify-center bg-emerald-600 text-white border border-transparent rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-lg disabled:opacity-50 font-black text-[10px]"
                                                    >
                                                        {isProcessing === debtor.id ? '...' : '+ PAYMENT'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(debtor.id)}
                                                        disabled={isProcessing === debtor.id}
                                                        className="h-10 w-10 flex items-center justify-center bg-white text-slate-400 border border-slate-100 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm hover:shadow-lg disabled:opacity-50"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
