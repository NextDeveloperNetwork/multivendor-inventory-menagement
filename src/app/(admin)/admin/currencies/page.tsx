import { getCurrencies } from '@/app/actions/settings';
import CurrenciesClient from '@/components/CurrenciesClient';
import { prisma } from '@/lib/prisma';
import { Coins } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CurrenciesPage() {
    const currencies = await prisma.currency.findMany({
        orderBy: { code: 'asc' }
    });

    const serializedCurrencies = JSON.parse(JSON.stringify(currencies));

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Coins size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Currencies Registry</h1>
                        <p className="text-sm text-slate-400 font-medium">Fiscal configuration & monetary systems</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex-1 flex flex-col">
                <CurrenciesClient initialCurrencies={serializedCurrencies} />
            </div>
        </div>
    );
}
