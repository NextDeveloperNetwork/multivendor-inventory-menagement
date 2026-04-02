import ProductionWorkforceClient from '@/components/ProductionWorkforceClient';
import { getSelectedBusinessId } from '@/app/actions/business';
import { getProductionWorkforce } from '@/app/actions/productionArticles';

export default async function ProductionWorkforcePage() {
    const businessId = await getSelectedBusinessId();
    const employees = await getProductionWorkforce(businessId || undefined);
    
    return <ProductionWorkforceClient 
        businessId={businessId ?? undefined} 
        initialEmployees={employees as any} 
    />;
}
