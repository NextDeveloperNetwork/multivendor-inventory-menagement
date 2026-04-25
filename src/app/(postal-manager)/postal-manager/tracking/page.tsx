import { getManagerDashboard } from '@/app/actions/postalOps';
import PostalManagerTracking from '@/components/PostalManagerTracking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManagerTrackingPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'POSTAL_MANAGER' && session.user.role !== 'ADMIN')) {
        redirect('/login');
    }

    const data = await getManagerDashboard();
    
    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <PostalManagerTracking 
                initialShipments={data.shipments || []} 
            />
        </div>
    );
}
