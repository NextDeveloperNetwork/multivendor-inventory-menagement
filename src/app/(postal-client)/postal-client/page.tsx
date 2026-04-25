import { getClientShipments } from '@/app/actions/postalOps';
import PostalClientUI from '@/components/PostalClientUI';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PostalClientPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'POSTAL_CLIENT' && session.user.role !== 'ADMIN')) {
        redirect('/login');
    }

    const data = await getClientShipments();
    
    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8">
            <PostalClientUI 
                initialShipments={data.shipments || []} 
                manager={data.myManager || null} 
                currencySymbol={data.currencySymbol}
            />
        </div>
    );
}
