import { prisma } from '@/lib/prisma';
import UsersClient from '@/components/UsersClient';
import { getUsers } from '@/app/actions/users';

export default async function UsersPage() {
    const users = await getUsers();
    const shops = await prisma.shop.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-8 lg:p-12">
            <UsersClient initialUsers={users} shops={shops} />
        </div>
    );
}
