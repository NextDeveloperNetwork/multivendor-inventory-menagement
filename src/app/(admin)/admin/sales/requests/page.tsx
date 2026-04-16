import { getInventoryRequests } from '@/app/actions/salesOps';
import SalesRequestsClient from '@/components/SalesRequestsClient';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminSalesRequestsPage() {
    const rawRequests = await getInventoryRequests();
    const requests = sanitizeData(rawRequests);

    return (
        <div className="max-w-[1600px] mx-auto px-1 md:px-0">
            <SalesRequestsClient initialRequests={requests} />
        </div>
    );
}
