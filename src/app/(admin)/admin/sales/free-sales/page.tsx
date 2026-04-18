import { getFreeSales } from '@/app/actions/salesOps';
import FreeSalesClient from '@/components/FreeSalesClient';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminFreeSalesPage() {
    const rawSales = await getFreeSales();
    const sales = sanitizeData(rawSales);

    return (
        <div className="max-w-[1600px] mx-auto px-1 md:px-0">
            <FreeSalesClient initialSales={sales} />
        </div>
    );
}
