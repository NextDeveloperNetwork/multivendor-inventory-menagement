'use client';

import { useState, useEffect } from 'react';
import { getProductInvoiceHistory } from '@/app/actions/inventory';
import {
    FileText,
    Download,
    X,
    Calendar,
    Store,
    Hash,
    Package,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
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

interface ProductHistoryDialogProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductHistoryDialog({ product, isOpen, onClose }: ProductHistoryDialogProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && product) {
            setLoading(true);
            getProductInvoiceHistory(product.id).then(data => {
                setHistory(data);
                setLoading(false);
            });
        }
    }, [isOpen, product]);

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Product Procurement History', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Asset Name: ${product.name}`, 14, 30);
        doc.text(`Global SKU: ${product.sku}`, 14, 35);
        doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 40);

        // Sub-stats
        const totalUnits = history.reduce((sum, item) => sum + item.quantity, 0);
        const avgCost = product.cost;

        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Inventory Balance: ${totalUnits} Units`, 14, 50);
        doc.text(`Current WAC Valuation: ${formatCurrency(avgCost)}`, 14, 55);

        // Table
        const tableData = history.map(item => [
            format(new Date(item.invoice.date), 'yyyy-MM-dd'),
            item.invoice.number,
            item.invoice.supplier?.name || 'N/A',
            item.quantity.toString(),
            formatCurrency(Number(item.cost)),
            formatCurrency(Number(item.cost) * item.quantity)
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['Date', 'Reference', 'Supplier', 'Quantity', 'Unit Cost', 'Subtotal']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
        });

        doc.save(`procurement_history_${product.sku}.pdf`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                <DialogHeader className="bg-white px-10 py-8 flex-row items-center justify-between space-y-0 shrink-0 border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                            <FileText size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none uppercase italic">
                                Procurement Ledger
                            </DialogTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black italic">{product?.name}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold font-mono">SKU: {product?.sku}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={downloadPDF}
                            disabled={loading || history.length === 0}
                            className="h-12 px-6 flex items-center gap-3 bg-white border-2 border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Download size={16} strokeWidth={2.5} /> Export Audit
                        </button>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200 shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-10 py-10 bg-white">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono italic">Synchronizing_Audit_Logs...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-32 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-100">
                                <FileText size={32} className="text-slate-300" strokeWidth={1} />
                            </div>
                            <div>
                                <h4 className="text-slate-900 text-sm font-black uppercase italic tracking-widest">Null_Transaction_Registry</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Void procurement history for target asset</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-serif text-slate-900 tracking-tight italic">Historical Activity</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{history.length} ENTRIES LOGGED</span>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                                        <TableRow className="hover:bg-transparent border-0">
                                            <TableHead className="h-14 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Auth_Stamp</TableHead>
                                            <TableHead className="h-14 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Ref_Identity</TableHead>
                                            <TableHead className="h-14 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Source_Entity</TableHead>
                                            <TableHead className="h-14 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Load_Qty</TableHead>
                                            <TableHead className="h-14 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Unit_Val</TableHead>
                                            <TableHead className="h-14 px-8 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Net_Valuation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((item, index) => (
                                            <TableRow key={index} className="group hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 h-16">
                                                <TableCell className="px-8 font-mono text-[10px] font-black text-slate-400 uppercase italic">
                                                    {format(new Date(item.invoice.date), 'yyyy.MM.dd')}
                                                </TableCell>
                                                <TableCell className="font-mono font-black text-[11px] text-slate-900 italic">
                                                    {item.invoice.number}
                                                </TableCell>
                                                <TableCell className="font-black text-[11px] text-slate-900">
                                                    <div className="flex items-center gap-3 uppercase tracking-tighter">
                                                        <Store size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                                                        {item.invoice.supplier?.name || "DIRECT_AUTH_NODE"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-black text-[11px] text-slate-900 tabular-nums">
                                                    +{item.quantity}_U
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-[10px] font-bold text-slate-500 tabular-nums">
                                                    {formatCurrency(Number(item.cost))}
                                                </TableCell>
                                                <TableCell className="px-8 text-right font-mono text-[11px] font-black text-slate-900 italic tabular-nums">
                                                    {formatCurrency(Number(item.cost) * item.quantity)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                {!loading && history.length > 0 && (
                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-between items-end">
                        <div className="flex gap-16">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] italic">AGGREGATE_FLOW</p>
                                <p className="text-2xl font-black text-slate-900 leading-none font-mono italic tracking-tighter">{history.reduce((sum, i) => sum + i.quantity, 0)} UNITS</p>
                            </div>
                            <div className="w-[1px] h-12 bg-slate-200" />
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] italic">CAPITAL_EXPENDITURE</p>
                                <p className="text-2xl font-black text-slate-900 leading-none font-mono italic tracking-tighter">
                                    {formatCurrency(history.reduce((sum, i) => sum + (Number(i.cost) * i.quantity), 0))}
                                </p>
                            </div>
                        </div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] italic font-mono border-b border-slate-200 pb-1">
                            AUTHORIZED_AUDIT_LOG_ENTRY // NODE_STK_MASTER
                        </div>
                    </div>
                )}
            </DialogContent>

        </Dialog>
    );
}
