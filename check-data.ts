import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const businesses = await prisma.business.findMany();
    console.log('Businesses:', businesses.length);
    for (const b of businesses) {
        const pCount = await prisma.product.count({ where: { businessId: b.id } });
        const wCount = await prisma.warehouse.count({ where: { businessId: b.id } });
        const iCount = await prisma.inventory.count({ where: { product: { businessId: b.id } } });
        const paCount = await prisma.productionArticle.count({ where: { businessId: b.id } });
        console.log(`Business: ${b.name} (${b.id}) - Products: ${pCount}, Warehouses: ${wCount}, Inventory: ${iCount}, ProductionArticles: ${paCount}`);
    }
}

main().finally(() => prisma.$disconnect());
