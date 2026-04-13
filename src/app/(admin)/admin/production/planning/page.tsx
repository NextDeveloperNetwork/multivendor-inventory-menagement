import ProductionPlanner from '@/components/ProductionPlanner';
import { getSelectedBusinessId } from '@/app/actions/business';

export default async function ProductionPlanningPage() {
    const bizId = await getSelectedBusinessId();
    return <ProductionPlanner businessId={bizId || undefined} />;
}
