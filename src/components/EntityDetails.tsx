'use client';

import { useState, useEffect } from 'react';
import { getShopDetails, getWarehouseDetails, getSupplierDetails } from '@/app/actions/map';
import {
    Store,
    Warehouse,
    Building2,
    TrendingUp,
    AlertTriangle,
    Package,
    FileText,
    Download,
    Loader2,
    DollarSign,
    Calendar,
    Hash
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EntityDetailsProps {
    entityId: string;
    entityType: 'shop' | 'warehouse' | 'supplier';
    entityName: string;
}

export default function EntityDetails({ entityId, entityType, entityName }: EntityDetailsProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            let result;

            if (entityType === 'shop') {
                result = await getShopDetails(entityId);
            } else if (entityType === 'warehouse') {
                result = await getWarehouseDetails(entityId);
            } else {
                result = await getSupplierDetails(entityId);
            }

            setData(result);
            setLoading(false);
        }

        fetchData();
    }, [entityId, entityType]);

    const downloadPDF = (title: string, columns: string[], rows: any[][]) => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 20);

        // Add subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(entityName, 14, 28);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

        // Add table
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 42,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
            styles: { fontSize: 9 }
        });

        doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-12 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 size={32} className="text-blue-600 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Details...</p>
                </div>
            </div>
        );
    }

    if (data?.error) {
        return (
            <div className="bg-white rounded-2xl border-2 border-red-100 p-12 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertTriangle size={32} className="text-red-600 mx-auto" />
                    <p className="text-sm font-bold text-red-600 uppercase tracking-widest">{data.error}</p>
                </div>
            </div>
        );
    }

    // Shop View
    if (entityType === 'shop' && data) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Column */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <TrendingUp size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Recent Sales</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{data.sales?.length || 0} Transactions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const rows = data.sales.map((sale: any) => [
                                    sale.id.slice(0, 8),
                                    new Date(sale.date).toLocaleDateString(),
                                    sale.itemCount.toString(),
                                    `$${Number(sale.total).toFixed(2)}`
                                ]);
                                downloadPDF('Shop Sales Report', ['ID', 'Date', 'Items', 'Total'], rows);
                            }}
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {data.sales && data.sales.length > 0 ? (
                            data.sales.map((sale: any) => (
                                <div key={sale.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-mono text-slate-400">#{sale.id.slice(0, 8)}</span>
                                        <span className="text-sm font-black text-emerald-600">${Number(sale.total).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(sale.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Package size={10} />
                                            {sale.itemCount} items
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <TrendingUp size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Sales Yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Column */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Low Stock Items</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{data.lowStockItems?.length || 0} Products</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const rows = data.lowStockItems.map((item: any) => [
                                    item.sku,
                                    item.productName,
                                    item.quantity.toString(),
                                    `$${Number(item.sellingPrice).toFixed(2)}`
                                ]);
                                downloadPDF('Low Stock Report', ['SKU', 'Product', 'Qty', 'Price'], rows);
                            }}
                            className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {data.lowStockItems && data.lowStockItems.length > 0 ? (
                            data.lowStockItems.map((item: any) => (
                                <div key={item.productId} className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-900 truncate">{item.productName}</span>
                                        <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">{item.quantity} left</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <span className="font-mono">{item.sku}</span>
                                        <span>${Number(item.sellingPrice).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Package size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Stocked Well</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Warehouse View
    if (entityType === 'warehouse' && data) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory On Hand Column */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                                <Package size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Inventory On Hand</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{data.inventoryOnHand?.length || 0} Products</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const rows = data.inventoryOnHand.map((item: any) => [
                                    item.sku,
                                    item.productName,
                                    item.quantity.toString(),
                                    `$${Number(item.costPrice).toFixed(2)}`
                                ]);
                                downloadPDF('Warehouse Inventory', ['SKU', 'Product', 'Qty', 'Cost'], rows);
                            }}
                            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {data.inventoryOnHand && data.inventoryOnHand.length > 0 ? (
                            data.inventoryOnHand.map((item: any) => (
                                <div key={item.productId} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-900 truncate">{item.productName}</span>
                                        <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">{item.quantity} units</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <span className="font-mono">{item.sku}</span>
                                        <span>${Number(item.costPrice).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Package size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Inventory</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Column */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Low Stock Items</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{data.lowStockItems?.length || 0} Products</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const rows = data.lowStockItems.map((item: any) => [
                                    item.sku,
                                    item.productName,
                                    item.quantity.toString(),
                                    `$${Number(item.costPrice).toFixed(2)}`
                                ]);
                                downloadPDF('Warehouse Low Stock', ['SKU', 'Product', 'Qty', 'Cost'], rows);
                            }}
                            className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {data.lowStockItems && data.lowStockItems.length > 0 ? (
                            data.lowStockItems.map((item: any) => (
                                <div key={item.productId} className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-900 truncate">{item.productName}</span>
                                        <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">{item.quantity} left</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <span className="font-mono">{item.sku}</span>
                                        <span>${Number(item.costPrice).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Package size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Stocked Well</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Supplier View
    if (entityType === 'supplier' && data) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Supplied Goods Column */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                                <Package size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Supplied Goods</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{data.suppliedGoods?.length || 0} Products</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const rows = data.suppliedGoods.map((item: any) => [
                                    item.sku,
                                    item.productName,
                                    item.totalQuantity.toString(),
                                    `$${Number(item.lastCost).toFixed(2)}`
                                ]);
                                downloadPDF('Supplier Products', ['SKU', 'Product', 'Total Qty', 'Last Cost'], rows);
                            }}
                            className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {data.suppliedGoods && data.suppliedGoods.length > 0 ? (
                            data.suppliedGoods.map((item: any) => (
                                <div key={item.productId} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-900 truncate">{item.productName}</span>
                                        <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">{item.totalQuantity} total</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <span className="font-mono">{item.sku}</span>
                                        <span>Last: ${Number(item.lastCost).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Package size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Products</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Business Data / Recent Invoices */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <FileText size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Recent Invoices</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{data.recentInvoices?.length || 0} Invoices</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const rows = data.recentInvoices.map((invoice: any) => [
                                    invoice.number,
                                    new Date(invoice.date).toLocaleDateString(),
                                    invoice.itemCount.toString(),
                                    `$${Number(invoice.total).toFixed(2)}`
                                ]);
                                downloadPDF('Supplier Invoices', ['Number', 'Date', 'Items', 'Total'], rows);
                            }}
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            PDF
                        </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                        {data.recentInvoices && data.recentInvoices.length > 0 ? (
                            data.recentInvoices.map((invoice: any) => (
                                <div key={invoice.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-900">#{invoice.number}</span>
                                        <span className="text-sm font-black text-blue-600">${Number(invoice.total).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Package size={10} />
                                            {invoice.itemCount} items
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <FileText size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Invoices</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
