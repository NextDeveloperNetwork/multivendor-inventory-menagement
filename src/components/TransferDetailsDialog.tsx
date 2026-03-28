'use client';

import { TruckIcon, Calendar, ArrowRight, Package, Warehouse, Store, Download, RotateCcw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
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

interface TransferDetailsDialogProps {
    transfer: any;
    children: React.ReactNode;
}

export default function TransferDetailsDialog({ transfer, children }: TransferDetailsDialogProps) {
    const sourceName = transfer.fromWarehouse?.name || transfer.fromShop?.name || 'Unset Node';
    const destName = transfer.toWarehouse?.name || transfer.toShop?.name || 'Unset Node';
    const totalUnits = transfer.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Logistics Transfer Manifest', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Transfer ID: #TR-${transfer.id.slice(-6).toUpperCase()}`, 14, 30);
        doc.text(`Source: ${sourceName}`, 14, 35);
        doc.text(`Destination: ${destName}`, 14, 40);
        doc.text(`Status: ${transfer.status || 'COMPLETED'}`, 14, 45);
        doc.text(`Date: ${formatDateTime(transfer.date)}`, 14, 50);
        doc.text(`Printed: ${format(new Date(), 'PPP p')}`, 14, 55);

        const tableData = transfer.items.map((item: any) => [
            { content: item.product.name, styles: { fontStyle: 'bold' } },
            item.quantity.toString(),
            (transfer.isReturn ? null : (item.returnedQuantity || 0).toString()),
            item.product.sku
        ]);

        autoTable(doc, {
            startY: 65,
            head: [[
                'Component', 
                transfer.isReturn ? 'Return Load' : 'Load Qty', 
                transfer.isReturn ? '-' : 'Rejected', 
                'Ref SKU'
            ]],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: transfer.isReturn ? [225, 29, 72] : [37, 99, 235], textColor: [255, 255, 255] },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'center', textColor: [220, 38, 38] },
                3: { fontStyle: 'italic', halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Loadout: ${totalUnits} Units`, 14, finalY);
        if(transfer.totalAmount) {
            doc.text(`Total Settlement: ${Number(transfer.totalAmount).toLocaleString()}`, 14, finalY + 7);
        }
        doc.save(`transfer_${transfer.id.slice(-6).toUpperCase()}.pdf`);
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
                            <TruckIcon size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none">
                                Movement Manifest
                            </DialogTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black italic">Ref Code: #TR-{transfer.id.slice(-6).toUpperCase()}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Logistic Deployment</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={downloadPDF}
                            className="h-12 px-6 flex items-center gap-3 bg-white border-2 border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            <Download size={16} strokeWidth={2.5} /> Export Manifest
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-10 py-10 bg-white">
                    {/* Route Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-12 bg-slate-50/50 p-10 rounded-2xl border border-slate-100 relative shadow-sm">
                        <div className="flex-1 flex flex-col items-center md:items-start w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-white rounded-xl text-slate-900 border border-slate-200 shadow-sm">
                                    {transfer.fromWarehouseId ? <Warehouse size={18} strokeWidth={1.5} /> : <Store size={18} strokeWidth={1.5} />}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] italic leading-none">ORIGIN_NODE</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{sourceName}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">{transfer.fromWarehouseId ? 'WAREHOUSE_ENTITY' : 'RETAIL_POINT'}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center text-slate-300">
                            <div className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                                <ArrowRight size={32} strokeWidth={1} className="hidden md:block" />
                                <ArrowRight size={32} strokeWidth={1} className="md:hidden rotate-90" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] mt-4 italic text-slate-400 whitespace-nowrap">DEPLOY_VECTOR</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center md:items-end w-full">
                            <div className="flex items-center gap-3 mb-4 md:flex-row-reverse">
                                <div className="p-2.5 bg-white rounded-xl text-slate-900 border border-slate-200 shadow-sm">
                                    {transfer.toWarehouseId ? <Warehouse size={18} strokeWidth={1.5} /> : <Store size={18} strokeWidth={1.5} />}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] italic leading-none">TARGET_NODE</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-right leading-none">{destName}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest text-right">{transfer.toWarehouseId ? 'WAREHOUSE_ENTITY' : 'RETAIL_POINT'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                        <div className="flex items-center gap-5 bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm">
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
                                <Calendar size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">TRANSFER_TIMESTAMP</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic tabular-nums">{formatDateTime(transfer.date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm">
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
                                <Package size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">LOGISTIC_VOLUME</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic tabular-nums">
                                    {totalUnits} UNITS
                                    {transfer.totalAmount && <span className="text-blue-600 ml-4">// VALUED AT {Number(transfer.totalAmount).toLocaleString()}</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stock Table Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-serif text-slate-900 tracking-tight italic flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                                Logistic Loadout
                            </h3>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{transfer.items.length} LINE ARTICLES</span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">{transfer.isReturn ? 'Article Detail' : 'Product Identifier'}</TableHead>
                                        <TableHead className="px-8 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">{transfer.isReturn ? 'Return Amount' : 'Load'}</TableHead>
                                        {!transfer.isReturn && <TableHead className="px-8 py-5 text-center text-[9px] font-black text-rose-500 uppercase tracking-[0.15em] italic">Rejected</TableHead>}
                                        <TableHead className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Global SKU</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfer.items.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 h-16">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all ${transfer.isReturn ? 'bg-rose-50/50 text-rose-500' : 'bg-slate-50/50 text-slate-400'}`}>
                                                        {transfer.isReturn ? <RotateCcw size={16} /> : <Package size={16} strokeWidth={1.5} />}
                                                    </div>
                                                    <span className="font-black text-slate-900 uppercase italic text-[11px] tracking-tight">{item.product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 text-center font-black text-slate-900 italic text-[11px] tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            {!transfer.isReturn && (
                                                <TableCell className="px-8 text-center font-black text-rose-500 italic text-[11px] tabular-nums">
                                                    {item.returnedQuantity || 0}
                                                </TableCell>
                                            )}
                                            <TableCell className="px-8 text-right font-black text-slate-400 text-[10px] tracking-widest">
                                                {item.product.sku}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="mt-12 flex justify-between items-end border-t border-slate-100 pt-10">
                        <div className="max-w-xs">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-100" /> Operational Status
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase italic">
                                This manifest represents a synchronized state change across the local node network. Authorized personnel must verify loadouts upon arrival at targeted destination nodes.
                            </p>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-8 text-white text-right min-w-[300px] shadow-[0_20px_50px_rgba(15,23,42,0.1)] relative overflow-hidden group border border-slate-800">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 italic">Transfer authorization</p>
                            <p className="text-3xl font-black italic uppercase tracking-tighter text-slate-100 drop-shadow-lg">{transfer.status || 'DEPLOYED'}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>

        </Dialog>
    );
}
