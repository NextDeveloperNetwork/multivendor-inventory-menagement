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
        supplierId?: string;
    }>
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
    const params = await searchParams;
    const { startDate, endDate, q, supplierId } = params;

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
    
    if (supplierId) {
        where.supplierId = supplierId;
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
            {/* ── Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-xl shadow-blue-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Decorative circles */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-8 right-24 w-32 h-32 rounded-full bg-white/5" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20">
                        <Package size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Inbound Logistics</h1>
                        <p className="text-sm text-blue-100 font-medium mt-0.5">Resource acquisition & manifests</p>
                    </div>
                </div>

                {/* Integrated Stats */}
                <div className="flex gap-4 relative z-10 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-2 px-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                    <div className="px-3 py-2 border-r border-white/10 flex flex-col justify-center">
                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest drop-shadow-sm">Total Manifests</p>
                        <p className="text-lg font-black text-white">{invoices.length}</p>
                    </div>
                    <div className="px-3 py-2 border-r border-white/10 flex flex-col justify-center">
                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest drop-shadow-sm">Today</p>
                        <p className="text-lg font-black text-white">{todayInvoices}</p>
                    </div>
                    <div className="px-3 py-2 flex flex-col justify-center">
                        <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest drop-shadow-sm">Valuation</p>
                        <p className="text-lg font-black text-emerald-50 tracking-tighter">{currency.symbol} {valuation.toLocaleString()}</p>
                    </div>
                </div>
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
