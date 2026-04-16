import { prisma } from '@/lib/prisma';
import { getBusinesses, getSelectedBusinessId, getBusinessFilter } from '@/app/actions/business';
import SalesManagerClient from '@/components/SalesManagerClient';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SalesManagerPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || ((session.user as any).role !== 'SALES_MANAGER' && (session.user as any).role !== 'ADMIN')) {
        redirect('/login');
    }

    const businesses = await getBusinesses();
    const businessFilter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();

    const [rawProducts, rawWarehouses, rawSuppliers, rawShops, rawCategories, rawUnits, baseCurrency] = await Promise.all([
        (prisma as any).product.findMany({
            where: { ...businessFilter },
            include: {
                inventory: {
                    include: { shop: true, warehouse: true }
                },
                unit: true,
                category: true
            },
            orderBy: { name: 'asc' }
        }),
        (prisma as any).warehouse.findMany({
            where: { 
                OR: [
                    { ...businessFilter },
                    { businessId: null }
                ]
            },
            orderBy: { name: 'asc' }
        }),
        (prisma as any).supplier.findMany({
            where: { ...businessFilter },
            orderBy: { name: 'asc' }
        }),
        (prisma as any).shop.findMany({
            where: { ...businessFilter },
            orderBy: { name: 'asc' }
        }),
        (prisma as any).productCategory.findMany({
            where: { ...businessFilter },
            orderBy: { name: 'asc' }
        }),
        (prisma as any).productUnit.findMany({
            where: { ...businessFilter },
            orderBy: { name: 'asc' }
        }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    // Today's sales
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const rawTodaySales = await (prisma as any).sale.findMany({
        where: {
            ...(selectedBusinessId ? { businessId: selectedBusinessId } : {}),
            createdAt: { gte: todayStart }
        },
        include: { items: { include: { product: true } }, user: true },
        orderBy: { createdAt: 'desc' }
    });

    const products = sanitizeData(rawProducts);
    const warehouses = sanitizeData(rawWarehouses);
    const suppliers = sanitizeData(rawSuppliers);
    const shops = sanitizeData(rawShops);
    const categories = sanitizeData(rawCategories);
    const units = sanitizeData(rawUnits);
    const todaySales = sanitizeData(rawTodaySales);
    const currencySymbol = baseCurrency?.symbol || '$';

    const activeBusiness = businesses.find(b => b.id === selectedBusinessId);

    return (
        <div className="min-h-screen bg-slate-50">
            <SalesManagerClient 
                products={products} 
                warehouses={warehouses} 
                suppliers={suppliers}
                shops={shops}
                categories={categories}
                units={units}
                todaySales={todaySales}
                businessId={selectedBusinessId} 
                businessName={activeBusiness?.name}
                currencySymbol={currencySymbol}
            />
        </div>
    );
}
