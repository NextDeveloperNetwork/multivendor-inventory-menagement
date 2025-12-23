import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import POSInterface from '@/components/POSClient';
import { sanitizeData } from '@/lib/utils';

export default async function SalesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
        return <div>Access Denied: No Shop Assigned</div>;
    }

    // Fetch all products and their inventory for this shop
    const rawProducts = await prisma.product.findMany({
        include: {
            inventory: {
                where: { shopId: session.user.shopId }
            }
        },
        orderBy: { name: 'asc' }
    });

    const products = sanitizeData(rawProducts);

    return (
        <div className="h-full">
            {/* We generally hide the navbar/title for POS to maximize space, or keep it minimal */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold">New Sale</h1>
            </div>
            <POSInterface products={products} shopId={session.user.shopId} />
        </div>
    );
}
