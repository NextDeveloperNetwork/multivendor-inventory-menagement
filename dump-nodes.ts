import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const warehouses = await prisma.warehouse.findMany();
    console.log('--- WAREHOUSES ---');
    warehouses.forEach(w => {
        console.log(`- ${w.name} (ID: ${w.id}) Business ID: ${w.businessId}`);
    });

    const shops = await prisma.shop.findMany();
    console.log('--- SHOPS ---');
    shops.forEach(s => {
        console.log(`- ${s.name} (ID: ${s.id}) Business ID: ${s.businessId}`);
    });
    
    const businesses = await prisma.business.findMany();
    console.log('--- BUSINESSES ---');
    businesses.forEach(b => {
        console.log(`- ${b.name} (ID: ${b.id})`);
    });
}

main().finally(() => prisma.$disconnect());
