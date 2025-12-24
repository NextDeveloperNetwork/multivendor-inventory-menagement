import { getSuppliers } from '@/app/actions/supplier';
import InvoiceClient from '../../../../components/InvoiceClient';
import { prisma } from '@/lib/prisma';
import { Package, FileText, Calendar, DollarSign } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

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

    const where: any = { ...dateFilter };
    if (q) {
        where.number = { contains: q };
    }

    const [rawInvoices, rawProducts, rawSuppliers, rawWarehouses, baseCurrency] = await Promise.all([
        prisma.invoice.findMany({
            where,
            include: {
                items: {
                    include: { product: true }
                },
                supplier: true,
            } as any,
            orderBy: { date: 'desc' },
        }),
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        getSuppliers(),
        prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const invoices = sanitizeData(rawInvoices);
    const products = sanitizeData(rawProducts);
    const suppliers = sanitizeData(rawSuppliers);
    const warehouses = sanitizeData(rawWarehouses);
    const currency = sanitizeData(baseCurrency) || { symbol: '$', rate: 1 };

    return (
        <div className="space-y-12 fade-in relative pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Inbound <span className="text-blue-600">Logistics</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            <Package size={20} className="text-blue-500" />
                            Synchronize Resource Acquisition Manifests
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'MANIFEST COUNT', value: invoices.length, icon: FileText, sub: 'Total Procurement Scripts' },
                    { label: 'ACTIVE BATCHES', value: invoices.filter((inv: any) => new Date(inv.date).toDateString() === new Date().toDateString()).length, icon: Calendar, sub: 'Current Interval Cycles' },
                    { label: 'ASSET VALUATION', value: `${currency.symbol}${(invoices.reduce((sum: number, inv: any) => sum + inv.items.reduce((itemSum: number, item: any) => itemSum + (Number(item.cost) * item.quantity), 0), 0)).toLocaleString()}`, icon: DollarSign, sub: 'Net Inventory Worth' }
                ].map((stat, idx) => (
                    // ... (rest of stats render remains same)
                    <div key={idx} className="bg-white p-12 rounded-[2.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative group hover:bg-blue-50 transition-all duration-500">
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <stat.icon size={32} />
                            </div>
                            <span className="text-[10px] font-black text-blue-200 group-hover:text-blue-400 transition-colors uppercase tracking-widest font-mono">0{idx + 1} // PRCR</span>
                        </div>
                        <div className="text-4xl font-black text-black mb-2 tracking-tighter underline decoration-4 decoration-blue-500/10 underline-offset-8 group-hover:decoration-blue-500/30 transition-all">{stat.value}</div>
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-6">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white border-2 border-blue-50 rounded-[3rem] p-1 shadow-2xl shadow-blue-500/5 overflow-hidden">
                <InvoiceClient
                    invoices={invoices}
                    products={products}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    currency={currency}
                />
            </div>
        </div>
    );
}
