import { prisma } from '@/lib/prisma';
import { sanitizeData } from '@/lib/utils';
import { getSelectedBusinessId } from '@/app/actions/business';
import NewProductClient from '@/components/NewProductClient';

export default async function NewProductPage() {
    const selectedBusinessId = await getSelectedBusinessId();
    const baseCurrency = await prisma.currency.findFirst({ where: { isBase: true } });
    const currency = sanitizeData(baseCurrency) || { symbol: '$', code: 'USD' };

    return <NewProductClient selectedBusinessId={selectedBusinessId} currency={currency} />;
}
