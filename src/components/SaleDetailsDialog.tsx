'use client';

import { ShoppingBag, Calendar, User, Store, Package, Download, Hash } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface SaleDetailsDialogProps {
    sale: any;
    children: React.ReactNode;
}

export default function SaleDetailsDialog({ sale, children }: SaleDetailsDialogProps) {
    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Sales Receipt', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Receipt Ref: #${sale.number || sale.id.slice(-6).toUpperCase()}`, 14, 30);
        doc.text(`Shop: ${sale.shop.name}`, 14, 35);
        doc.text(`Cashier: ${sale.user.name}`, 14, 40);
        doc.text(`Date: ${formatDateTime(sale.date)}`, 14, 45);
        doc.text(`Printed: ${format(new Date(), 'PPP p')}`, 14, 50);

        const tableData = sale.items.map((item: any) => [
            { content: item.product.name, styles: { fontStyle: 'bold' } },
            item.quantity.toString(),
            formatCurrency(item.price),
            formatCurrency(item.price * item.quantity)
        ]);

        autoTable(doc, {
            startY: 60,
            head: [['Article', 'Qty', 'Price', 'Subtotal']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                1: { halign: 'center' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: ${formatCurrency(sale.total)}`, 200, finalY, { align: 'right' });

        doc.save(`receipt_${sale.number || sale.id.slice(-6).toUpperCase()}.pdf`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl flex flex-col bg-white">
                {/* Header Section */}
                <div className="px-10 py-10 bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <ShoppingBag size={32} />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                                    Sale <span className="text-primary/60">Details</span>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/10 not-italic">
                                        REF #{sale.number || sale.id.slice(-6).toUpperCase()}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic flex items-center gap-2">
                                    <Hash size={12} className="text-primary" /> Transaction identifier & spectral breakdown
                                </DialogDescription>
                            </div>
                        </div>
                        <button
                            onClick={downloadPDF}
                            className="h-14 px-8 flex items-center gap-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/20 group"
                        >
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Save Receipt
                        </button>
                    </div>
                </div>

                <div className="p-10 bg-white overflow-y-auto custom-scrollbar">
                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-primary/20 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-xl text-primary border border-slate-100 shadow-sm flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                                <Store size={20} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Shop Node</p>
                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{sale.shop.name}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-primary/20 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-xl text-primary border border-slate-100 shadow-sm flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                                <User size={20} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Authorized Cashier</p>
                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{sale.user.name}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-primary/20 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-xl text-primary border border-slate-100 shadow-sm flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                                <Calendar size={20} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Timestamp</p>
                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{formatDateTime(sale.date)}</p>
                        </div>
                    </div>

                    {/* Items Table Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] italic">Spectral Breakdown</h3>
                            <div className="h-[1px] flex-1 bg-slate-100"></div>
                        </div>
                        <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left bg-white">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 italic">Inventory Article</th>
                                        <th className="px-8 py-5 text-center italic">Quantity</th>
                                        <th className="px-8 py-5 text-right italic">Unit Price</th>
                                        <th className="px-8 py-5 text-right italic">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sale.items.map((item: any) => (
                                        <tr key={item.id} className="text-sm group/row hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm group-hover/row:scale-110 transition-transform">
                                                        <Package size={18} />
                                                    </div>
                                                    <span className="font-black text-slate-900 uppercase tracking-tight italic group-hover/row:underline decoration-primary/20 decoration-4 underline-offset-4">{item.product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-900 font-black font-mono">
                                                    {item.quantity}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right text-slate-400 font-bold italic">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-black text-slate-900 text-lg italic tracking-tighter">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="mt-12 flex justify-between items-end bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all pointer-events-none">
                            <ShoppingBag size={120} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest italic">Settled & Verified</span>
                            </div>
                        </div>
                        <div className="text-right border-l border-slate-200 pl-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Grand Total</p>
                            <div className="text-5xl font-black text-primary italic tracking-tighter font-mono flex items-start justify-end">
                                <span className="text-xl mt-1">$</span>{sale.total.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
