'use client';

import { TruckIcon, Calendar, ArrowRight, Package, Warehouse, Store, Download } from 'lucide-react';
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
            item.product.sku
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['Component', 'Loadout Qty', 'Reference SKU']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
            columnStyles: {
                1: { halign: 'center' },
                2: { fontStyle: 'italic', halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Movement Loadout: ${totalUnits} Units`, 14, finalY);

        doc.save(`transfer_${transfer.id.slice(-6).toUpperCase()}.pdf`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col">
                {/* Header Section */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <TruckIcon size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic mb-0.5">
                                    Transfer Details
                                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-200 px-3 py-1 rounded-full not-italic">
                                        #TR-{transfer.id.slice(-6).toUpperCase()}
                                    </span>
                                </DialogTitle>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory movement and location synchronization</p>
                            </div>
                        </div>
                        <button
                            onClick={downloadPDF}
                            className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm italic"
                        >
                            <Download size={14} /> Download PDF
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white overflow-y-auto">
                    {/* Route Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 bg-slate-50 p-8 rounded-2xl border border-slate-100 relative shadow-sm">
                        <div className="flex-1 flex flex-col items-center md:items-start w-full">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                    {transfer.fromWarehouseId ? <Warehouse size={16} /> : <Store size={16} />}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">ORIGIN</p>
                            </div>
                            <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{sourceName}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{transfer.fromWarehouseId ? 'WAREHOUSE' : 'RETAIL'}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center text-blue-300">
                            <ArrowRight size={32} className="hidden md:block" />
                            <ArrowRight size={32} className="md:hidden rotate-90" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-3 italic whitespace-nowrap">Stock Route</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center md:items-end w-full">
                            <div className="flex items-center gap-3 mb-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">DESTINATION</p>
                                <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                    {transfer.toWarehouseId ? <Warehouse size={16} /> : <Store size={16} />}
                                </div>
                            </div>
                            <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter text-right leading-none">{destName}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{transfer.toWarehouseId ? 'WAREHOUSE' : 'RETAIL'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="p-2.5 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">TRANSFER DATE</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic font-mono">{formatDateTime(transfer.date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="p-2.5 bg-white rounded-lg text-blue-600 border border-slate-100 shadow-sm">
                                <Package size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">STOCK VOLUME</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic font-mono">{totalUnits} Units Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Stock Table Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] mb-4 italic flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600" />
                            Transfer Items List
                        </h3>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Product</TableHead>
                                        <TableHead className="px-6 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Quantity</TableHead>
                                        <TableHead className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest italic">SKU</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfer.items.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 h-14">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                                        <Package size={14} />
                                                    </div>
                                                    <span className="font-black text-slate-900 uppercase italic text-[11px] tracking-tight">{item.product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center font-black text-slate-900 bg-slate-50/10 italic text-[11px]">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right font-black text-slate-400 font-mono text-[10px]">
                                                {item.product.sku}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="mt-8 flex justify-end">
                        <div className="bg-slate-900 rounded-2xl p-6 text-white text-right min-w-[200px] shadow-xl shadow-slate-200 border border-slate-800">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2 italic">Transfer Status</p>
                            <p className="text-3xl font-black italic uppercase tracking-tighter text-blue-400">{transfer.status || 'COMPLETED'}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
