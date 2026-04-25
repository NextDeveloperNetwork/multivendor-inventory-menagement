import { getManagerDashboard } from '@/app/actions/postalOps';
import PostalManagerUI from '@/components/PostalManagerUI';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PostalManagerPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'POSTAL_MANAGER' && session.user.role !== 'ADMIN')) {
        redirect('/login');
    }

    const data = await getManagerDashboard();
    
    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <PostalManagerUI 
                initialClients={data.clients || []} 
                initialShipments={data.shipments || []} 
                currencySymbol={data.currencySymbol}
                economics={data.economics}
            />
        </div>
    );
}
