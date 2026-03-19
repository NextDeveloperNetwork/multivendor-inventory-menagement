import { getSuppliers } from '@/app/actions/supplier';
import InvoiceClient from '../../../../components/InvoiceClient';
import { prisma } from '@/lib/prisma';
import { Package, FileText, Calendar, DollarSign } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

interface InvoicesPageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        q?: string;
    }>
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
    const params = await searchParams;
    const { startDate, endDate, q } = params;

    const businessFilter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.date.lte = end;
        }
    }

    const where: any = { ...businessFilter, ...dateFilter };
    if (q) {
        where.number = { contains: q, mode: 'insensitive' };
    }

    const [rawInvoices, rawProducts, rawSuppliers, rawWarehouses, rawShops, baseCurrency] = await Promise.all([
        prisma.invoice.findMany({
            where: where as any,
            include: {
                items: {
                    include: { product: true }
                },
                supplier: true,
                warehouse: true,
                shop: true,
            } as any,
            orderBy: { date: 'desc' },
        }),
        prisma.product.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        getSuppliers(businessFilter as any),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const invoices = sanitizeData(rawInvoices);
    const products = sanitizeData(rawProducts);
    const suppliers = sanitizeData(rawSuppliers);
    const warehouses = sanitizeData(rawWarehouses);
    const shops = sanitizeData(rawShops);
    const currency = sanitizeData(baseCurrency) || { symbol: '$', rate: 1, code: 'USD' };

    return (
        <div className="space-y-6 fade-in relative pb-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Compact Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Package size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            INBOUND <span className="text-blue-600">LOGISTICS</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] pl-[3.25rem]">
                        Resource Acquisition & Manifest Management
                    </p>
                </div>

                {/* Compact Stats Row */}
                <div className="flex flex-wrap items-center gap-6 md:gap-12">
                    {[
                        { label: 'MANIFESTS', value: invoices.length, icon: FileText },
                        { label: 'TODAY', value: invoices.filter((inv: any) => new Date(inv.date).toDateString() === new Date().toDateString()).length, icon: Calendar },
                        { label: 'VALUATION', value: `${currency.symbol}${(invoices.reduce((sum: number, inv: any) => sum + inv.items.reduce((itemSum: number, item: any) => itemSum + (Number(item.cost) * item.quantity), 0), 0)).toLocaleString()}`, icon: DollarSign }
                    ].map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                <stat.icon size={16} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-slate-900 leading-none">{stat.value}</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-300 rounded-[2rem] p-1 shadow-xl shadow-blue-500/5 overflow-hidden">
                <InvoiceClient
                    invoices={invoices}
                    products={products}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    shops={shops}
                    currency={currency}
                    selectedBusinessId={selectedBusinessId}
                />
            </div>
        </div>
    );
}
