import { getCurrencies } from '@/app/actions/settings';
import CurrenciesClient from '@/components/CurrenciesClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CurrenciesPage() {
    // We sanitize data to plain objects because Decimal from Prisma isn't directly serializable to client components in Next 15
    const currencies = await prisma.currency.findMany({
        orderBy: { code: 'asc' }
    });

    const serializedCurrencies = JSON.parse(JSON.stringify(currencies));

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6 text-slate-900">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Currencies <span className="text-blue-600">Registry</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Fiscal Configuration & Monetary Systems Registry
                    </p>
                </div>
            </div>

            <CurrenciesClient initialCurrencies={serializedCurrencies} />
        </div>
    );
}
