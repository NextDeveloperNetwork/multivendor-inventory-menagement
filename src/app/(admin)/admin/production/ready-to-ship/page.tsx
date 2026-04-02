import ProductionReadyClient from '@/components/ProductionReadyClient';
import { getSelectedBusinessId } from '@/app/actions/business';

export default async function ReadyToShipPage() {
    const businessId = await getSelectedBusinessId();
    return <ProductionReadyClient businessId={businessId ?? undefined} />;
}
