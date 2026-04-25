'use client';

import { FileText, Calendar, Store, Package, Warehouse, Download, Layers } from 'lucide-react';
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
    currency: { symbol: string, code?: string };
}

export default function InvoiceDetailsDialog({ invoice, children, currency }: InvoiceDetailsDialogProps) {
    const symbol = currency?.symbol || '$';
    const totalAmount = invoice.items.reduce((sum: number, item: any) => sum + (Number(item.cost) * item.quantity), 0);

    const downloadPDF = () => {
        const doc = new jsPDF();

        // ── Header Graphic ──
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text('FATURE BLERJE', 14, 23);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('FATURE BLERJE-LISTA E ARTIKUJVE', 14, 31);

        // ── Meta Info ──
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);

        doc.setFont('helvetica', 'bold');
        doc.text('Manifest Reference:', 14, 58);
        doc.setFont('helvetica', 'normal');
        doc.text(`#${invoice.number}`, 14, 64);

        doc.setFont('helvetica', 'bold');
        doc.text('Supplier Entity:', 70, 58);
        doc.setFont('helvetica', 'normal');
        doc.text(`${invoice.supplier?.name || 'EXTERNAL_SOURCE'}`, 70, 64);

        doc.setFont('helvetica', 'bold');
        doc.text('Target Destination:', 130, 58);
        doc.setFont('helvetica', 'normal');
        doc.text(`${invoice.items[0]?.warehouse?.name || 'MAGAZINA'}`, 130, 64);

        doc.setFont('helvetica', 'bold');
        doc.text('Date:', 15, 75);
        doc.text('Generated:', 100, 75);

        doc.setFont('helvetica', 'normal');
        doc.text(`${formatDateTime(invoice.date)}`, 15, 81);
        doc.text(`${format(new Date(), 'PPP p')}`, 100, 81);

        // ── Table ──
        const tableData = invoice.items.map((item: any) => [
            { content: item.product?.name, styles: { fontStyle: 'bold' } },
            item.product?.sku || '-',
            item.quantity.toString(),
            formatCurrency(item.cost, symbol),
            formatCurrency(Number(item.cost) * item.quantity, symbol)
        ]);

        autoTable(doc, {
            startY: 90,
            head: [['Article Identity', 'SKU Ref', 'Qty', 'Unit Cost', 'Subtotal']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [241, 245, 249], // slate-100
                textColor: [15, 23, 42], // slate-900
                fontStyle: 'bold',
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            bodyStyles: {
                textColor: [71, 85, 105], // slate-600
                lineColor: [226, 232, 240],
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // slate-50
            },
            columnStyles: {
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
            }
        });

        // ── Summary Totals ──
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        // Final line
        doc.setDrawColor(226, 232, 240);
        doc.line(120, finalY - 5, 196, finalY - 5);

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Total Components:', 120, finalY);
        doc.setTextColor(15, 23, 42);
        doc.text(`${invoice.items.length}`, 196, finalY, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('Gross Valuation:', 120, finalY + 10);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text(`${formatCurrency(totalAmount, symbol)}`, 196, finalY + 10, { align: 'right' });

        doc.save(`Invoice_${invoice.number}.pdf`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[900px] max-h-[90vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col bg-slate-50">
                {/* ── Premium Header ── */}
                <DialogHeader className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 px-8 py-8 flex-row items-center justify-between space-y-0 shrink-0 overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 left-10 w-40 h-40 bg-indigo-900/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <Layers size={30} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-black text-2xl tracking-tight leading-none mb-1.5">
                                Procurement Ledger
                            </DialogTitle>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-100 border border-emerald-500/30">
                                    VERIFIED
                                </span>
                                <span className="text-blue-100 text-[10px] uppercase tracking-[0.2em] font-semibold">Ref: #{invoice.number}</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col gap-2">
                        <button
                            onClick={downloadPDF}
                            className="h-10 px-5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white border border-white/20 hover:border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:text-blue-700 transition-all shadow-sm active:scale-95 backdrop-blur-md"
                        >
                            <Download size={14} strokeWidth={2.5} /> Download PDF
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto w-full p-8">
                    {/* ── Meta Pills ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                <Store size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Supplier Source</p>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{invoice.supplier?.name || 'Unknown Source'}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <Calendar size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fiscal Date</p>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight tabular-nums truncate">{formatDateTime(invoice.date)}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                                <Warehouse size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target Vault</p>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{invoice.items[0]?.warehouse?.name || 'Primary Node'}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Items Table ── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 justify-between items-center flex">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Asset Manifest</h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{invoice.items.length} Entries</span>
                        </div>

                        <div className="overflow-auto max-h-[35vh]">
                            <Table>
                                <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                                    <TableRow className="hover:bg-white border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                                        <TableHead className="px-6 py-4">Item Identity</TableHead>
                                        <TableHead className="px-6 py-4 text-center">Volume</TableHead>
                                        <TableHead className="px-6 py-4 text-right">Acquisition Cost</TableHead>
                                        <TableHead className="px-6 py-4 text-right">Calculated Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 h-14">
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <Package size={12} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block text-xs">{item.product?.name}</span>
                                                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">{item.product?.sku}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-center text-xs font-black text-slate-800 tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-6 text-right text-xs text-slate-500 font-bold tabular-nums">
                                                {formatCurrency(item.cost, symbol)}
                                            </TableCell>
                                            <TableCell className="px-6 text-right text-xs font-black text-slate-900 tabular-nums">
                                                {formatCurrency(Number(item.cost) * item.quantity, symbol)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* ── Summary Block ── */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4 items-end justify-between">
                        <div className="w-full md:w-auto p-4 bg-slate-100 border border-slate-200 rounded-xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Integrity Note</p>
                            <p className="text-[10px] text-slate-500 font-medium max-w-sm">
                                All calculated subtotals and the gross ledger valuation are final. Values reflect exactly what was inserted at the moment of registration.
                            </p>
                        </div>
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white min-w-[320px] shadow-lg shadow-slate-900/20 relative overflow-hidden flex flex-col items-end shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-10 -translate-y-10" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Gross Ledger Value</p>
                            <p className="text-3xl font-black tabular-nums tracking-tighter">
                                {formatCurrency(totalAmount, symbol)}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
