/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ShoppingCart, Package, User, Clock, Warehouse, Trash2, ChevronRight, ChevronLeft, FileText, Download } from 'lucide-react';
import SaleDetailsDialog from './SaleDetailsDialog';
import ArticleReportDialog from './ArticleReportDialog';
import { deleteSalesManagerSale } from '@/app/actions/salesManager';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalesManagerInputsClientProps {
    initialSales: any[];
    currencySymbol?: string;
}

export default function SalesManagerInputsClient({ initialSales, currencySymbol = '$' }: SalesManagerInputsClientProps) {
    const [sales, setSales] = useState<any[]>(initialSales);
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const filteredSales = sales.filter((sale: any) => {
        if (!dateFilter) return true;
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        return saleDate === dateFilter;
    });

    const shiftDate = (days: number) => {
        const current = dateFilter ? new Date(dateFilter) : new Date();
        current.setDate(current.getDate() + days);
        setDateFilter(current.toISOString().split('T')[0]);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Sales Operations Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${dateFilter || 'All Records'}`, 14, 30);
        doc.text(`Total Sales: ${filteredSales.length}`, 14, 36);
        
        const totalAmount = filteredSales.reduce((sum, s) => sum + Number(s.total), 0);
        doc.text(`Total Revenue: ${currencySymbol}${totalAmount.toLocaleString()}`, 14, 42);

        const tableData = filteredSales.map(s => [
            s.number,
            new Date(s.date).toLocaleTimeString(),
            s.warehouse?.name || 'Global',
            s.user?.name || 'System',
            `${s.items.length} items`,
            `${currencySymbol}${Number(s.total).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['Trx #', 'Time', 'Warehouse', 'Manager', 'Qty', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [5, 150, 105] } // Emerald-600
        });

        doc.save(`Sales_Report_${dateFilter || 'Export'}.pdf`);
        toast.success('PDF Report Generated');
    };



    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sale? This will restore the stock to the warehouse.')) return;
        
        setIsDeleting(id);
        const res = await deleteSalesManagerSale(id);
        setIsDeleting(null);

        if (res.success) {
            toast.success('Sale deleted and stock restored');
            setSales(sales.filter(s => s.id !== id));
        } else {
            toast.error(res.error || 'Failed to delete sale');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Date Filter & PDF */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <ShoppingCart size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Sales Operations</h1>
                        <p className="text-[10px] md:text-sm text-slate-400 font-medium tracking-tight italic">Direct Warehouse Dispatches</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => shiftDate(-1)}
                            className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-emerald-600"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        
                        <div className="relative px-2">
                            <input 
                                type="date" 
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-transparent border-none text-sm font-black text-slate-900 outline-none cursor-pointer p-0 w-32 uppercase italic"
                            />
                        </div>

                        <button 
                            onClick={() => shiftDate(1)}
                            className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-emerald-600"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={generatePDF}
                        className="flex items-center justify-center gap-2 px-5 h-12 md:h-11 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                    >
                        <FileText size={14} /> Trx Report
                    </button>

                    <ArticleReportDialog sales={sales} currencySymbol={currencySymbol}>
                        <button className="flex items-center justify-center gap-2 px-5 h-12 md:h-11 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                            <Package size={14} /> Article Report
                        </button>
                    </ArticleReportDialog>
                </div>
            </div>

            {/* Sales List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredSales.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-slate-900 font-bold italic uppercase">No Operations Found</h3>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1 opacity-60">Try adjusting your date filters</p>
                    </div>
                ) : (
                    filteredSales.map((sale: any) => (
                        <div key={sale.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-all group flex flex-col lg:flex-row">
                            {/* Mobile Header */}
                            <div className="lg:hidden border-b border-slate-50 p-4 bg-slate-50/50 flex items-center justify-between font-bold">
                                <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500 tracking-tighter">#{sale.number || 'N/A'}</span>
                                <span className="text-xs font-black text-slate-900 italic">{currencySymbol}{Number(sale.total).toLocaleString()}</span>
                            </div>

                            <div className="flex-1 min-w-0 p-4 md:p-6 flex items-start gap-4 md:gap-6">
                                <div className="hidden sm:flex w-12 h-12 bg-slate-50 rounded-xl items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all border border-slate-100 shrink-0">
                                    <Warehouse size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-black text-slate-900 uppercase italic text-sm truncate">{sale.warehouse?.name || 'Central Domain'}</h3>
                                        <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-400">#{sale.number}</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5"><User size={10} className="text-emerald-500" /> {sale.user?.name || 'System'}</div>
                                        <div className="flex items-center gap-1.5"><Clock size={10} className="text-slate-300" /> {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>

                                    {/* Large Sales Grid Support */}
                                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                        {sale.items.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-100 rounded-lg group/item hover:bg-white transition-colors">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[140px] italic">
                                                    {item.product.name}
                                                </span>
                                                <span className="text-[10px] font-black text-emerald-600 ml-2 shrink-0">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/20 p-4 md:px-8 flex items-center justify-between lg:justify-end gap-8 shrink-0">
                                <div className="flex flex-col items-start lg:items-end gap-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Proceeds</p>
                                    <p className="text-2xl font-black text-slate-900 italic leading-none">{currencySymbol}{Number(sale.total).toLocaleString()}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <SaleDetailsDialog sale={sale}>
                                        <button className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow-lg bg-white/50">
                                            <Download size={18} />
                                        </button>
                                    </SaleDetailsDialog>
                                    <button 
                                        onClick={() => handleDelete(sale.id)}
                                        disabled={isDeleting === sale.id}
                                        className={cn(
                                            "h-11 w-11 flex items-center justify-center rounded-xl transition-all border border-transparent shadow-sm hover:shadow-lg bg-white/50",
                                            isDeleting === sale.id ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-rose-600 hover:bg-white hover:border-slate-200"
                                        )}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
