import ProductionMachineryClient from '@/components/ProductionMachineryClient';
import { getSelectedBusinessId } from '@/app/actions/business';
import { getProductionMachinery } from '@/app/actions/productionArticles';

export default async function ProductionMachineryPage() {
    const businessId = await getSelectedBusinessId();
    const machines = await getProductionMachinery(businessId || undefined);
    
    return <ProductionMachineryClient 
        businessId={businessId ?? undefined} 
        initialMachines={machines as any} 
    />;
}
