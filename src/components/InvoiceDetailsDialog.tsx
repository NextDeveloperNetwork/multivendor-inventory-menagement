'use client';

import { FileText, Calendar, Store, Package, Warehouse, Download } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoiceDetailsDialogProps {
    invoice: any;
    children: React.ReactNode;
    currency: { symbol: string };
}

export default function InvoiceDetailsDialog({ invoice, children, currency }: InvoiceDetailsDialogProps) {
    const symbol = currency?.symbol || '$';
    const totalAmount = invoice.items.reduce((sum: number, item: any) => sum + (Number(item.cost) * item.quantity), 0);

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Procurement Invoice', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Invoice Ref: #${invoice.number}`, 14, 30);
        doc.text(`Supplier: ${invoice.supplier?.name || 'External Source'}`, 14, 35);
        doc.text(`Destination: ${invoice.items[0]?.warehouse?.name || 'Default Node'}`, 14, 40);
        doc.text(`Date: ${formatDateTime(invoice.date)}`, 14, 45);
        doc.text(`Printed: ${format(new Date(), 'PPP p')}`, 14, 50);

        const tableData = invoice.items.map((item: any) => [
            { content: item.product?.name, styles: { fontStyle: 'bold' } },
            item.product?.sku,
            item.quantity.toString(),
            formatCurrency(item.cost, symbol),
            formatCurrency(Number(item.cost) * item.quantity, symbol)
        ]);

        autoTable(doc, {
            startY: 60,
            head: [['Component', 'SKU', 'Loadout', 'Unit Cost', 'Subtotal']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                2: { halign: 'center' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Valuation: ${formatCurrency(totalAmount, symbol)}`, 200, finalY, { align: 'right' });

        doc.save(`invoice_${invoice.number}.pdf`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                {/* Header Section */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <FileText size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    Invoice Details
                                    <span className="text-xs font-bold text-slate-400 uppercase bg-slate-200 px-2 py-0.5 rounded-full">
                                        #{invoice.number}
                                    </span>
                                </DialogTitle>
                                <p className="text-sm font-medium text-slate-500">Procurement manifest and asset reconciliation</p>
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
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supplier</p>
                                <p className="text-sm font-bold text-slate-900">{invoice.supplier?.name || 'External Source'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-bold text-slate-900">{formatDateTime(invoice.date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <Warehouse size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</p>
                                <p className="text-sm font-bold text-slate-900">{invoice.items[0]?.warehouse?.name || 'Default Node'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Asset Manifest</h3>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Component</TableHead>
                                        <TableHead className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Loadout</TableHead>
                                        <TableHead className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit Cost</TableHead>
                                        <TableHead className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs shadow-sm">
                                                        <Package size={14} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">{item.product?.name}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">{item.product?.sku}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center font-black text-slate-600">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right text-slate-500 font-medium">
                                                {formatCurrency(item.cost, symbol)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right font-black text-slate-900 text-base">
                                                {formatCurrency(Number(item.cost) * item.quantity, symbol)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="mt-8 flex justify-end">
                        <div className="bg-slate-900 rounded-2xl p-6 text-white text-right min-w-[200px] shadow-xl shadow-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 italic">Vetted Valuation</p>
                            <p className="text-3xl font-black italic">{formatCurrency(totalAmount, symbol)}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
