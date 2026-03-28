import { prisma } from '@/lib/prisma';
import { getBusinessFilter } from '@/app/actions/business';
import { getSuppliers } from '@/app/actions/supplier';
import { sanitizeData } from '@/lib/utils';
import CostReportClient from '@/components/CostReportClient';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CostReportsPage() {
    const businessFilter = await getBusinessFilter();
    
    const [products, suppliers, currency] = await Promise.all([
        prisma.product.findMany({
            where: businessFilter as any,
            orderBy: { name: 'asc' }
        }),
        getSuppliers(businessFilter as any),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const sanitizedProducts = sanitizeData(products);
    const sanitizedSuppliers = sanitizeData(suppliers);
    const sanitizedCurrency = sanitizeData(currency) || { symbol: 'ALL', rate: 1, code: 'ALL' };

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Cost Analysis Matrix</h1>
                        <p className="text-sm text-slate-400 font-medium">Strategic procurement & asset reconciliation</p>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Metrics Feed
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-1">Scanning {sanitizedProducts.length} items</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex-1 flex flex-col">
                <CostReportClient 
                    products={sanitizedProducts}
                    suppliers={sanitizedSuppliers}
                    currency={sanitizedCurrency}
                />
            </div>
        </div>
    );
}
