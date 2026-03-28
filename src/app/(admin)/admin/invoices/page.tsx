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

    let where: any = { ...dateFilter };
    if (selectedBusinessId) {
        where = {
            ...where,
            OR: [
                { businessId: selectedBusinessId },
                { shop: { businessId: selectedBusinessId } },
                { warehouse: { businessId: selectedBusinessId } }
            ]
        };
    }

    if (q) {
        where.number = { contains: q, mode: 'insensitive' };
    }

    const [rawInvoices, rawProducts, rawSuppliers, rawWarehouses, rawShops, baseCurrency] = await Promise.all([
        (prisma as any).invoice.findMany({
            where: where as any,
            include: {
                items: { include: { product: true } },
                supplier: true,
                warehouse: true,
                shop: true,
            },
            orderBy: { date: 'desc' },
        }),
        prisma.product.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        getSuppliers(businessFilter),
        prisma.warehouse.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const invoices = sanitizeData(rawInvoices);
    const products = sanitizeData(rawProducts);
    const suppliers = sanitizeData(rawSuppliers);
    const warehouses = sanitizeData(rawWarehouses);
    const shops = sanitizeData(rawShops);
    const currency = sanitizeData(baseCurrency) || { symbol: 'ALL', rate: 1, code: 'ALL' };

    const todayInvoices = invoices.filter((inv: any) => new Date(inv.date).toDateString() === new Date().toDateString()).length;
    const valuation = invoices.reduce((sum: number, inv: any) => sum + inv.items.reduce((itemSum: number, item: any) => itemSum + (Number(item.cost) * item.quantity), 0), 0);

    const stats = [
        { label: 'Total Manifests', value: invoices.length, icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: "Today's Activity", value: todayInvoices, icon: Calendar, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'Total Valuation', value: `${currency.symbol} ${valuation.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
    ];

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Inbound Logistics</h1>
                        <p className="text-sm text-slate-400 font-medium">Resource acquisition & manifest management</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 p-6">
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
