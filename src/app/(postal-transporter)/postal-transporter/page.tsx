import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTransporterShipments } from '@/app/actions/postalOps';
import PostalTransporterUI from '@/components/PostalTransporterUI';

export const dynamic = 'force-dynamic';

export default async function PostalTransporterPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'POSTAL_TRANSPORTER') {
        redirect('/login');
    }

    const data = await getTransporterShipments();

    return (
        <div className="max-w-7xl mx-auto md:p-6">
            <PostalTransporterUI 
                initialShipments={data.shipments || []} 
                currencySymbol={data.currencySymbol}
            />
        </div>
    );
}
