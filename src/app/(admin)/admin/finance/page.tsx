import { prisma } from '@/lib/prisma';
import AdminMoneyClient from '@/components/AdminMoneyClient';
import { Landmark } from 'lucide-react';
import { getAllCashTransfers } from '@/app/actions/money';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
    const filter = await import('@/app/actions/business').then(m => m.getBusinessFilter());
    const [cashTransfers, baseCurrency, shops] = await Promise.all([
        getAllCashTransfers(),
        prisma.currency.findFirst({ where: { isBase: true } }),
        prisma.shop.findMany({
            where: filter as any || {},
            orderBy: { name: 'asc' }
        })
    ]);

    const serializedTransfers = sanitizeData(cashTransfers);
    const baseCurrencySymbol = baseCurrency?.symbol || '$';

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto fade-in">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Treasury & Deposits</h1>
                        <p className="text-sm text-slate-400 font-medium">Headquarters cash flow reconciliation</p>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Awaiting Review: {cashTransfers.filter((t: any) => t.status === 'PENDING').length}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-1">Total Logs: {cashTransfers.length}</div>
                </div>
            </div>

            <AdminMoneyClient 
                initialTransfers={serializedTransfers} 
                baseCurrencySymbol={baseCurrencySymbol} 
                shops={shops ? sanitizeData(shops) : []}
            />
        </div>
    );
}
