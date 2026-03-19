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
            <DialogContent className="max-w-4xl bg-white rounded-2xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
                <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FileText size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-black uppercase italic tracking-tighter">PROCUREMENT_LEDGER</DialogTitle>
                            <DialogDescription className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                <Package size={10} /> {product?.name} <span className="text-white/30">|</span> {product?.sku}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={downloadPDF}
                            disabled={loading || history.length === 0}
                            className="h-9 px-4 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-lg font-black uppercase tracking-widest text-[8px] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-30 border border-slate-200 shadow-sm"
                        >
                            <Download size={14} /> EXPORT_DATA
                        </button>
                        <button onClick={onClose} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">SYNCING_REGISTRY_LOGS...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-dashed border-slate-200">
                                <FileText size={24} className="text-slate-300" />
                            </div>
                            <div>
                                <h4 className="text-slate-900 text-xs font-black uppercase italic tracking-tight">NULL_DATA_DETECTED</h4>
                                <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1 italic">VOID TRANSACTION HISTORY FOR TARGET ASSET</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableHead className="h-12 px-8 text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">STAMP_NODE</TableHead>
                                        <TableHead className="h-12 text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">REFERENCE_ID</TableHead>
                                        <TableHead className="h-12 text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">SUPPLIER_ENTITY</TableHead>
                                        <TableHead className="h-12 text-center text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono w-32">QTY_U</TableHead>
                                        <TableHead className="h-12 text-right text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono w-48">VAL_UNIT</TableHead>
                                        <TableHead className="h-12 px-8 text-right text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono w-48">VAL_NET</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item, index) => (
                                        <TableRow key={index} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0 h-14">
                                            <TableCell className="px-8 font-mono text-[9px] font-black text-slate-400 uppercase italic">
                                                {format(new Date(item.invoice.date), 'yyyy.MM.dd')}
                                            </TableCell>
                                            <TableCell className="font-mono font-black text-[10px] text-slate-900 italic">
                                                {item.invoice.number}
                                            </TableCell>
                                            <TableCell className="font-black text-[10px] text-slate-900">
                                                <div className="flex items-center gap-2 uppercase tracking-tight">
                                                    <Store size={12} className="text-blue-500" />
                                                    {item.invoice.supplier?.name || "DIRECT_AUTH"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono font-black text-[10px] text-slate-900">
                                                +{item.quantity}_U
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[10px] font-black text-slate-400">
                                                {formatCurrency(Number(item.cost))}
                                            </TableCell>
                                            <TableCell className="px-8 text-right font-mono text-[10px] font-black text-blue-600 italic">
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
                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center px-10">
                        <div className="flex gap-10">
                            <div>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">LIFETIME_STOCK_FLOW</p>
                                <p className="text-lg font-black text-slate-900 leading-none font-mono italic">{history.reduce((sum, i) => sum + i.quantity, 0)} _U</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">TOTAL_CAPITAL_ALLOCATION</p>
                                <p className="text-lg font-black text-blue-600 leading-none font-mono italic">
                                    {formatCurrency(history.reduce((sum, i) => sum + (Number(i.cost) * i.quantity), 0))}
                                </p>
                            </div>
                        </div>
                        <div className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] italic font-mono">
                            AUTHORIZED_AUDIT_LOG_ENTRY // NODE_STK_MASTER
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
