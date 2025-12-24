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

    const shop = await prisma.shop.findUnique({
        where: { id: session.user.shopId },
        include: { currency: true }
    });

    const products = sanitizeData(rawProducts);

    return (
        <div className="h-full">
            <POSInterface
                products={products}
                shopId={session.user.shopId}
                currency={shop?.currency ? JSON.parse(JSON.stringify(shop.currency)) : null}
            />
        </div>
    );
}
