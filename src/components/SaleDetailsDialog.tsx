'use client';

import { ShoppingBag, Calendar, User, Store, Package, Download } from 'lucide-react';
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
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                {/* Header Section */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    Sale Details
                                    <span className="text-xs font-bold text-slate-400 uppercase bg-slate-200 px-2 py-0.5 rounded-full">
                                        #{sale.number || sale.id.slice(-6).toUpperCase()}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-sm font-medium text-slate-500">Transaction summary and items</DialogDescription>
                            </div>
                        </div>
                        <button
                            onClick={downloadPDF}
                            className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download size={14} /> Download PDF
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white">
                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <Store size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop</p>
                                <p className="text-sm font-bold text-slate-900">{sale.shop.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cashier</p>
                                <p className="text-sm font-bold text-slate-900">{sale.user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-bold text-slate-900">{formatDateTime(sale.date)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Inventory Breakdown</h3>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left bg-white">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Article</th>
                                        <th className="px-6 py-4 text-center">Qty</th>
                                        <th className="px-6 py-4 text-right">Price</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium">
                                    {sale.items.map((item: any) => (
                                        <tr key={item.id} className="text-sm group hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs shadow-sm">
                                                        <Package size={14} />
                                                    </div>
                                                    <span className="font-bold text-slate-900 underline decoration-blue-100 underline-offset-4">{item.product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-slate-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                                                {formatCurrency(item.price * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="mt-8 flex justify-end">
                        <div className="bg-blue-600 rounded-2xl p-6 text-white text-right min-w-[200px] shadow-xl shadow-blue-200">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Grand Total</p>
                            <p className="text-3xl font-black">{formatCurrency(sale.total)}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
