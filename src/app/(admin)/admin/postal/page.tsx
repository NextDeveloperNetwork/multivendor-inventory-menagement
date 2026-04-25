import { getPostalUsers } from '@/app/actions/postalAdminOps';
import PostalAdminClient from '@/components/PostalAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPostalPage() {
    const data = await getPostalUsers();
    
    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-0">
            <PostalAdminClient 
                initialManagers={data.managers || []} 
                initialPendingManagers={data.pendingManagers || []}
                initialClients={data.clients || []} 
                initialRelations={data.relations || []} 
                currencySymbol={data.currencySymbol}
                economics={data.economics}
            />
        </div>
    );
}
