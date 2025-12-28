import { getCustomers } from '@/app/actions/intelligence';
import CustomersClient from '@/components/CustomersClient';
import { getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
    const customers = await getCustomers();
    const selectedBusinessId = await getSelectedBusinessId();

    return (
        <CustomersClient initialCustomers={customers} selectedBusinessId={selectedBusinessId} />
    );
}
