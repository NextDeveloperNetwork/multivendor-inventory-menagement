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
        <div className="p-10">
            <CurrenciesClient initialCurrencies={serializedCurrencies} />
        </div>
    );
}
