import { getTransporters } from '@/app/actions/transporters';
import { getSelectedBusinessId } from '@/app/actions/business';
import TransporterManager from '@/components/TransporterManager';

export const dynamic = 'force-dynamic';

export default async function TransportersAdminPage() {
    const businessId = await getSelectedBusinessId();
    const transporters = await getTransporters(businessId || undefined);

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            <TransporterManager 
                initialTransporters={transporters} 
                businessId={businessId || undefined} 
            />
        </div>
    );
}
