import { getSortingCenterShipments } from "@/app/actions/postalAdminOps";
import PostalSortingClient from "@/components/PostalSortingClient";

export default async function SortingCenterPage() {
    const res = await getSortingCenterShipments();
    
    return (
        <div className="p-6">
            <PostalSortingClient 
                initialShipments={res.shipments || []} 
                managers={res.managers || []} 
            />
        </div>
    );
}
