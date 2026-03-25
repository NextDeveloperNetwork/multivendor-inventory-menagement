'use client';

import { useState, useMemo } from 'react';
import { 
    Search, Filter, Calendar, Store, Package, 
    DollarSign, BarChart3, RefreshCw, Layers, History,
    LayoutGrid, Activity, Download, ArrowUpRight, ArrowDownRight,
    TrendingUp, TrendingDown, ClipboardCheck, ArrowRightLeft
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getInvoiceItemReport, getSaleItemReport } from '@/app/actions/reports';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface CostReportClientProps {
    products: any[];
    suppliers: any[];
    currency: any;
}

export default function CostReportClient({ products, suppliers, currency }: CostReportClientProps) {
    const symbol = currency?.symbol || '$';
    
    const [productId, setProductId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [saleItems, setSaleItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const [invoices, sales] = await Promise.all([
                getInvoiceItemReport({ productId, supplierId, startDate, endDate }),
                getSaleItemReport({ productId, startDate, endDate })
            ]);
            setInvoiceItems(invoices);
            setSaleItems(sales);
            setHasAnalyzed(true);
        } catch (error) {
            toast.error('Strategic analysis acquisition failed.');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => {
        let totalCostQty = 0;
        let totalCostValue = 0;
        let minCost = Infinity;
        let maxCost = -Infinity;
        invoiceItems.forEach(item => {
            const qty = item.quantity;
            const cost = Number(item.cost);
            totalCostQty += qty;
            totalCostValue += qty * cost;
            if (cost < minCost) minCost = cost;
            if (cost > maxCost) maxCost = cost;
        });

        let totalSaleQty = 0;
        let totalSaleValue = 0;
        saleItems.forEach(item => {
            const qty = item.quantity;
            const price = Number(item.price);
            totalSaleQty += qty;
            totalSaleValue += qty * price;
        });

        const avgCost = totalCostQty > 0 ? totalCostValue / totalCostQty : 0;
        const avgPrice = totalSaleQty > 0 ? totalSaleValue / totalSaleQty : 0;
        const grossProfit = totalSaleValue - (totalSaleQty * avgCost);
        const margin = totalSaleValue > 0 ? (grossProfit / totalSaleValue) * 100 : 0;

        return {
            totalCostQty, totalCostValue, avgCost,
            minCost: minCost === Infinity ? 0 : minCost,
            maxCost: maxCost === -Infinity ? 0 : maxCost,
            totalSaleQty, totalSaleValue, avgPrice, grossProfit, margin
        };
    }, [invoiceItems, saleItems]);

    const exportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
        const selectedProduct = products.find(p => p.id === productId)?.name || 'Consolidated Matrix';
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('FINANCIAL AUDIT MANIFEST', 15, 25);
        doc.setFontSize(10);
        doc.text(`Target Entity: ${selectedProduct}`, 15, 33);
        doc.text(`Registry Timestamp: ${format(new Date(), 'PPP p')}`, 282, 33, { align: 'right' });

        autoTable(doc, {
            startY: 50,
            body: [
                ['Procurement Valuation', formatCurrency(metrics.totalCostValue, symbol), 'Distribution Revenue', formatCurrency(metrics.totalSaleValue, symbol)],
                ['Average Acquisition', formatCurrency(metrics.avgCost, symbol), 'Average Realization', formatCurrency(metrics.avgPrice, symbol)],
                ['Net Asset Delta', metrics.totalCostQty - metrics.totalSaleQty + ' Units', 'Margin Reconciliation', metrics.margin.toFixed(2) + '%']
            ],
            theme: 'grid',
            styles: { fontSize: 9, halign: 'center' }
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Inbound Logistics', 'Date', 'Manifest', 'Source', 'Qty', 'Unit Cost', 'Subtotal']],
            body: invoiceItems.map(item => ['', formatDateTime(item.invoice?.date), '#' + item.invoice?.number, item.invoice?.supplier?.name || 'VEND', item.quantity, formatCurrency(item.cost, symbol), formatCurrency(Number(item.cost) * item.quantity, symbol)]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Outbound Distribution', 'Date', 'Registry', 'Shop', 'Qty', 'Unit Price', 'Revenue']],
            body: saleItems.map(item => ['', formatDateTime(item.sale?.date), '#' + item.sale?.number, item.sale?.shop?.name || 'NODE', item.quantity, formatCurrency(item.price, symbol), formatCurrency(Number(item.price) * item.quantity, symbol)]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
        });
        doc.save(`audit_${timestamp}.pdf`);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 max-w-full overflow-hidden">
            {/* Ultra-Compact Control Center */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-end gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Article_ID</label>
                        <div className="relative">
                            <input
                                list="report-products"
                                onChange={(e) => {
                                    const prod = products.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                                    setProductId(prod ? prod.id : '');
                                }}
                                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-900 focus:border-slate-900 outline-none transition-all uppercase"
                                placeholder="TARGET..."
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <datalist id="report-products">
                                {products.map(p => <option key={p.id} value={p.name}>{p.sku}</option>)}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Source_Entity</label>
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-900 focus:border-slate-900 outline-none transition-all appearance-none uppercase"
                        >
                            <option value="">ALL SOURCES</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Genesis_Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-900 focus:border-slate-900 outline-none transition-all font-mono"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Expiry_Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-900 focus:border-slate-900 outline-none transition-all font-mono"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="h-9 px-6 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-2 shadow-sm shrink-0 flex-1 md:flex-none"
                    >
                        {loading ? <RefreshCw size={12} className="animate-spin" /> : <BarChart3 size={12} />}
                        Analyze
                    </button>
                    {hasAnalyzed && (
                        <button
                            onClick={exportPDF}
                            className="h-9 w-9 bg-white border border-slate-200 rounded-lg text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
                            title="Export PDF"
                        >
                            <Download size={14} />
                        </button>
                    )}
                </div>
            </div>

            {hasAnalyzed && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {/* Linear Metrics Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { label: 'Procurement', val: formatCurrency(metrics.totalCostValue, symbol), sub: `${metrics.totalCostQty} Units`, icon: TrendingDown, color: 'text-rose-600 bg-rose-50/50 border-rose-100' },
                            { label: 'Distribution', val: formatCurrency(metrics.totalSaleValue, symbol), sub: `${metrics.totalSaleQty} Units`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100' },
                            { label: 'Avg Unit Cost', val: formatCurrency(metrics.avgCost, symbol), sub: 'Weighted Average', icon: DollarSign, color: 'text-slate-600 bg-slate-50/50 border-slate-100' },
                            { label: 'Avg Unit Rev', val: formatCurrency(metrics.avgPrice, symbol), sub: 'Weighted Average', icon: Activity, color: 'text-slate-600 bg-slate-50/50 border-slate-100' },
                            { label: 'Gross Margin', val: `${metrics.margin.toFixed(2)}%`, sub: formatCurrency(metrics.grossProfit, symbol), icon: ArrowRightLeft, color: 'text-white bg-slate-900 border-slate-900' }
                        ].map((m, idx) => (
                            <div key={idx} className={`px-4 py-3 rounded-xl border ${m.color} flex flex-col justify-center`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60 italic">{m.label}</span>
                                    <m.icon size={12} />
                                </div>
                                <div className="text-[14px] font-black italic tracking-tighter leading-none">{m.val}</div>
                                <div className="text-[8px] font-bold uppercase tracking-widest mt-1.5 opacity-50 truncate">{m.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Side-by-Side Manifests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-250px)] min-h-[500px]">
                        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-900 flex items-center gap-2">
                                    <TrendingDown size={12} /> Inbound Reconciliation
                                </span>
                                <span className="text-[9px] font-black text-slate-300 font-mono tracking-widest">{invoiceItems.length} ENTRIES</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white z-10">
                                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                                            <TableHead className="pl-4 h-8 text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</TableHead>
                                            <TableHead className="h-8 text-[8px] font-black text-slate-400 uppercase tracking-widest">Source/Ref</TableHead>
                                            <TableHead className="pr-4 h-8 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">Valuation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoiceItems.map(item => (
                                            <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                                <TableCell className="pl-4 py-2 border-r border-slate-50">
                                                    <span className="text-[10px] font-black text-slate-900 font-mono italic">{formatDateTime(item.invoice?.date).split(',')[0]}</span>
                                                </TableCell>
                                                <TableCell className="py-2 border-r border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-700 uppercase leading-none truncate max-w-[120px]">{item.invoice?.supplier?.name || 'VEND'}</span>
                                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1 italic">#{item.invoice?.number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="pr-4 py-2 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-slate-900 italic tabular-nums">{item.quantity} x {formatCurrency(item.cost, symbol)}</span>
                                                        <span className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{formatCurrency(Number(item.cost) * item.quantity, symbol)}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-900 flex items-center gap-2">
                                    <TrendingUp size={12} /> Outbound Realization
                                </span>
                                <span className="text-[9px] font-black text-slate-300 font-mono tracking-widest">{saleItems.length} ENTRIES</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white z-10">
                                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                                            <TableHead className="pl-4 h-8 text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</TableHead>
                                            <TableHead className="h-8 text-[8px] font-black text-slate-400 uppercase tracking-widest">Node/Ref</TableHead>
                                            <TableHead className="pr-4 h-8 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">Realization</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {saleItems.map(item => (
                                            <TableRow key={item.id} className="group hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                                <TableCell className="pl-4 py-2 border-r border-slate-50">
                                                    <span className="text-[10px] font-black text-slate-900 font-mono italic">{formatDateTime(item.sale?.date).split(',')[0]}</span>
                                                </TableCell>
                                                <TableCell className="py-2 border-r border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-700 uppercase leading-none truncate max-w-[120px]">{item.sale?.shop?.name || 'NODE'}</span>
                                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1 italic">#{item.sale?.number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="pr-4 py-2 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-slate-900 italic tabular-nums">{item.quantity} x {formatCurrency(item.price, symbol)}</span>
                                                        <span className="text-[8px] text-emerald-600 font-bold mt-1 uppercase tracking-tighter">{formatCurrency(Number(item.price) * item.quantity, symbol)}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
