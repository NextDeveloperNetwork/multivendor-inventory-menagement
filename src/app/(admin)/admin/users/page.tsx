import { prisma } from '@/lib/prisma';
import UsersClient from '@/components/UsersClient';
import { getUsers } from '@/app/actions/users';
import { getTransporters } from '@/app/actions/transporters';
import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export default async function UsersPage() {
    const businessFilter = await getBusinessFilter();
    const businessId = await getSelectedBusinessId();

    const [users, shops, transporters] = await Promise.all([
        getUsers(),
        prisma.shop.findMany({ where: businessFilter as any, orderBy: { name: 'asc' } }),
        getTransporters(businessId || undefined)
    ]);

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            <UsersClient 
                initialUsers={users} 
                shops={shops} 
                transporters={transporters} 
            />
        </div>
    );
}
