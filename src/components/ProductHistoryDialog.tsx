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
    DialogTitle,
    DialogDescription,
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
            <DialogContent className="max-w-4xl bg-white rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-black p-10 text-white flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FileText size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Procurement Ledger</DialogTitle>
                            <DialogDescription className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Package size={12} /> {product?.name} // {product?.sku}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={downloadPDF}
                            disabled={loading || history.length === 0}
                            className="h-12 px-6 bg-white text-black hover:bg-blue-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-30"
                        >
                            <Download size={16} /> Export PDF
                        </button>
                        <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-10 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Registry History...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
                                <FileText size={32} className="text-slate-200" />
                            </div>
                            <div>
                                <h4 className="text-slate-900 font-black uppercase italic tracking-tight">No Transactions Detected</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 italic">This asset has no recorded procurement events.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-slate-50 rounded-[2rem] overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Date / Node</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</TableHead>
                                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Entity</TableHead>
                                        <TableHead className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Qty</TableHead>
                                        <TableHead className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-48">Unit Cost</TableHead>
                                        <TableHead className="py-6 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-48">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item, index) => (
                                        <TableRow key={index} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0 h-20">
                                            <TableCell className="px-8 font-mono text-[10px] font-black text-slate-400 uppercase italic">
                                                {format(new Date(item.invoice.date), 'yyyy.MM.dd')}
                                            </TableCell>
                                            <TableCell className="font-bold text-xs text-black italic">
                                                {item.invoice.number}
                                            </TableCell>
                                            <TableCell className="font-bold text-xs text-black">
                                                <div className="flex items-center gap-2">
                                                    <Store size={14} className="text-blue-500" />
                                                    {item.invoice.supplier?.name || "DIRECT"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-black text-xs text-black">
                                                +{item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs font-black text-slate-900">
                                                {formatCurrency(Number(item.cost))}
                                            </TableCell>
                                            <TableCell className="px-8 text-right font-mono text-xs font-black text-blue-600 italic">
                                                {formatCurrency(Number(item.cost) * item.quantity)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {!loading && history.length > 0 && (
                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-12">
                        <div className="flex gap-10">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Lifetime Procurement</p>
                                <p className="text-xl font-black text-black leading-none">{history.reduce((sum, i) => sum + i.quantity, 0)} Units</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200" />
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Capital Injected</p>
                                <p className="text-xl font-black text-blue-600 leading-none">
                                    {formatCurrency(history.reduce((sum, i) => sum + (Number(i.cost) * i.quantity), 0))}
                                </p>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 uppercase italic">
                            Authorized Audit Log // System Master
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
