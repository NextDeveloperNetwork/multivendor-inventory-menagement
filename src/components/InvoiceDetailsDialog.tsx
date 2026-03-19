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
            <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                {/* Header Section */}
                <DialogHeader className="bg-white px-10 py-8 flex-row items-center justify-between space-y-0 shrink-0 border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                            <FileText size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none">
                                Procurement Manifest
                            </DialogTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black italic">Ref Code: #{invoice.number}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Asset Reconciliation</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={downloadPDF}
                            className="h-12 px-6 flex items-center gap-3 bg-white border-2 border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            <Download size={16} strokeWidth={2.5} /> Export Ledger
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-10 py-10 bg-white">
                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <Store size={12} className="text-slate-900" /> Entity Source
                            </label>
                            <div className="pl-5 border-l-2 border-slate-200">
                                <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter">{invoice.supplier?.name || 'EXTERNAL_VEND'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">Registered Supplier</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <Calendar size={12} className="text-slate-900" /> Logistics Stamp
                            </label>
                            <div className="pl-5 border-l-2 border-slate-200">
                                <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter tabular-nums">{formatDateTime(invoice.date)}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">Deployment Date</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <Warehouse size={12} className="text-slate-900" /> Target Node
                            </label>
                            <div className="pl-5 border-l-2 border-slate-200">
                                <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter">{invoice.items[0]?.warehouse?.name || 'MASTER_NODE'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">Archive Destination</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-serif text-slate-900 tracking-tight">Stock Manifest</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{invoice.items.length} LINE ARTICLES</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Article Identity</TableHead>
                                        <TableHead className="px-8 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Load Qty</TableHead>
                                        <TableHead className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Unit Cost</TableHead>
                                        <TableHead className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 h-16">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all border border-slate-100 shadow-sm">
                                                        <Package size={14} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block tracking-tight">{item.product?.name}</span>
                                                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5 block">{item.product?.sku}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 text-center font-black text-slate-900 tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-8 text-right text-slate-500 font-bold tabular-nums">
                                                {formatCurrency(item.cost, symbol)}
                                            </TableCell>
                                            <TableCell className="px-8 text-right font-black text-slate-900 italic tabular-nums">
                                                {formatCurrency(Number(item.cost) * item.quantity, symbol)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="mt-12 flex justify-between items-end border-t border-slate-100 pt-10">
                        <div className="max-w-xs">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-100" /> Logistics Verification
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase italic">
                                This document serves as a verified procurement record. All asset valuations are rounded to the nearest decimal and stored in the core encrypted ledger. 
                            </p>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-8 text-white text-right min-w-[300px] shadow-[0_20px_50px_rgba(15,23,42,0.1)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4 italic">Aggregated Valuation</p>
                            <p className="text-4xl font-black italic tracking-tighter drop-shadow-lg">{formatCurrency(totalAmount, symbol)}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>

        </Dialog>
    );
}
