import { prisma } from '@/lib/prisma';
import { getBusinessFilter } from '@/app/actions/business';
import { getSuppliers } from '@/app/actions/supplier';
import { sanitizeData } from '@/lib/utils';
import CostReportClient from '@/components/CostReportClient';
import { Activity, Receipt, TrendingDown } from 'lucide-react';

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
    const sanitizedCurrency = sanitizeData(currency) || { symbol: '$', rate: 1, code: 'USD' };

    return (
        <div className="space-y-4 fade-in relative pb-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-2">
            {/* Compact Report Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                            <Activity size={18} />
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-1.5 pt-0.5">
                            COST <span className="text-slate-400 font-medium italic">ANALYSIS</span> MATRIX
                        </h1>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] pl-[3rem] italic">
                        Strategic Procurement & Asset Reconciliation
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Metrics Feed
                        </div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Scanning {sanitizedProducts.length} Articles</div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <TrendingDown size={14} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">WAC_CALC</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">SYSTEM ACTIVE</div>
                        </div>
                    </div>
                </div>
            </div>

            <CostReportClient 
                products={sanitizedProducts}
                suppliers={sanitizedSuppliers}
                currency={sanitizedCurrency}
            />
        </div>
    );
}
