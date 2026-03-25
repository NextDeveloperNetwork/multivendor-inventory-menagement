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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
            <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                {/* Header Section */}
                <DialogHeader className="bg-white px-10 py-8 flex-row items-center justify-between space-y-0 shrink-0 border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                            <ShoppingBag size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none uppercase italic">
                                Receipt Manifest
                            </DialogTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black italic">Ref Code: #{sale.number || sale.id.slice(-6).toUpperCase()}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold">Transaction Record</span>
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
                                <Store size={12} className="text-slate-900" /> Node Origin
                            </label>
                            <div className="pl-5 border-l-2 border-slate-200">
                                <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter">{sale.shop.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">Retail Terminal</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <User size={12} className="text-slate-900" /> Authorized By
                            </label>
                            <div className="pl-5 border-l-2 border-slate-200">
                                <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter">{sale.user.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">Verified Cashier</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <Calendar size={12} className="text-slate-900" /> Logistics Stamp
                            </label>
                            <div className="pl-5 border-l-2 border-slate-200">
                                <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter tabular-nums">{formatDateTime(sale.date)}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">Transaction Timestamp</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-serif text-slate-900 tracking-tight italic">Inventory Articles</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sale.items.length} LINE ARTICLES</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <Table className="w-full text-left bg-white border-collapse">
                                <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Article Descriptor</TableHead>
                                        <TableHead className="px-8 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Volume</TableHead>
                                        <TableHead className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Unit Price</TableHead>
                                        <TableHead className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.items.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 h-16">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all border border-slate-100 shadow-sm">
                                                        <Package size={16} strokeWidth={1.5} />
                                                    </div>
                                                    <span className="font-black text-slate-900 uppercase italic text-[11px] tracking-tight">{item.product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 text-center font-black text-slate-900 italic text-[11px] tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-8 text-right text-slate-500 font-bold tabular-nums">
                                                {formatCurrency(item.price)}
                                            </TableCell>
                                            <TableCell className="px-8 text-right font-black text-slate-900 italic text-lg tabular-nums">
                                                {formatCurrency(item.price * item.quantity)}
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
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4 flex items-center gap-2 italic">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Transaction Status
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase italic">
                                This transaction has been settled, verified, and synchronized across all localized retail nodes. Capital flow is finalized as of the confirmed timestamp.
                            </p>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-8 text-white text-right min-w-[300px] shadow-[0_20px_50px_rgba(15,23,42,0.1)] relative overflow-hidden group border border-slate-800">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 italic">Settled valuation</p>
                            <p className="text-4xl font-black italic tracking-tighter drop-shadow-lg">{formatCurrency(sale.total)}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>

        </Dialog>
    );
}
