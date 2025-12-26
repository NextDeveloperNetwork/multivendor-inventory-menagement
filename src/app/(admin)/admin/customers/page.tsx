import { getCustomers, createCustomer } from '@/app/actions/intelligence';
import CustomersClient from '@/components/CustomersClient';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
    const customers = await getCustomers();

    return (
        <CustomersClient initialCustomers={customers} />
    );
}
