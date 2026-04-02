import ProductionPlanner from '@/components/ProductionPlanner';
import { getSelectedBusinessId } from '@/app/actions/business';

export default async function ProductionPlanningPage() {
    const businessId = await getSelectedBusinessId();
    return <ProductionPlanner businessId={businessId ?? undefined} />;
}
