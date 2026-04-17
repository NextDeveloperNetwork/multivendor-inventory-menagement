/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Calendar, Download, FileText, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ArticleReportDialogProps {
    sales: any[];
    currencySymbol?: string;
    children: React.ReactNode;
}

export default function ArticleReportDialog({ sales, currencySymbol = '$', children }: ArticleReportDialogProps) {
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isOpen, setIsOpen] = useState(false);

    const filteredSales = useMemo(() => {
        return sales.filter((sale: any) => {
            const saleDate = new Date(sale.date).toISOString().split('T')[0];
            return saleDate >= startDate && saleDate <= endDate;
        });
    }, [sales, startDate, endDate]);

    const productStats = useMemo(() => {
        const stats: Record<string, { name: string, qty: number, total: number }> = {};
        filteredSales.forEach(sale => {
            sale.items.forEach((item: any) => {
                if (!stats[item.productId]) {
                    stats[item.productId] = { name: item.product.name, qty: 0, total: 0 };
                }
                stats[item.productId].qty += item.quantity;
                stats[item.productId].total += (item.quantity * Number(item.price));
            });
        });
        return Object.values(stats).sort((a, b) => b.qty - a.qty);
    }, [filteredSales]);

    const totalPeriodSales = productStats.reduce((sum, p) => sum + p.total, 0);
    const totalPeriodQty = productStats.reduce((sum, p) => sum + p.qty, 0);

    const generatePDF = () => {
        if (productStats.length === 0) {
            toast.error('No data to export for this period');
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Article Movement Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
        
        const tableData = productStats.map(p => [
            p.name,
            p.qty.toString(),
            `${currencySymbol}${(p.total / p.qty).toFixed(2)}`,
            `${currencySymbol}${p.total.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Product Name', 'Total Qty', 'Avg Price', 'Total Sales']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] } // Blue-600
        });

        doc.save(`Article_Report_${startDate}_to_${endDate}.pdf`);
        toast.success('Article Report Generated');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl bg-slate-50 border-slate-200 p-0 overflow-hidden shadow-2xl rounded-3xl">
                <DialogHeader className="p-6 md:p-8 bg-white border-b border-slate-100 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                <Package size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
                                    Article Report
                                </DialogTitle>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                    Period Analysis & Preview
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={generatePDF}
                            disabled={productStats.length === 0}
                            className="hidden sm:flex items-center gap-2 px-6 h-12 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} /> Export PDF
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-3">
                            <Calendar size={16} className="text-slate-400 ml-2 shrink-0" />
                            <div className="flex-1 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start</span>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-sm font-black text-slate-900 outline-none cursor-pointer p-0"
                                />
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 shrink-0" />
                        <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-3">
                            <Calendar size={16} className="text-slate-400 ml-2 shrink-0" />
                            <div className="flex-1 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End</span>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-sm font-black text-slate-900 outline-none cursor-pointer p-0"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={generatePDF}
                        disabled={productStats.length === 0}
                        className="sm:hidden flex items-center justify-center gap-2 w-full h-12 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-200 disabled:opacity-50"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                </DialogHeader>

                <div className="p-6 md:p-8 bg-slate-50 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    {productStats.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-slate-900 font-bold italic uppercase">No Articles Found</h3>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1 opacity-60">Adjust the period to see data</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Quantity</p>
                                    <p className="text-xl font-black text-slate-900 italic mt-0.5">{totalPeriodQty}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period Revenue</p>
                                    <p className="text-xl font-black text-blue-600 italic mt-0.5">{currencySymbol}{totalPeriodSales.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {productStats.map((p, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate w-full mb-3" title={p.name}>
                                            {p.name}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">x{p.qty}</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-900 italic">
                                                {currencySymbol}{p.total.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

