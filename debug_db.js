const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- DATABASE INSPECTION ---');

    try {
        const businesses = await prisma.business.findMany();
        console.log('Businesses:', businesses.map(b => ({ id: b.id, name: b.name })));

        const models = ['product', 'shop', 'warehouse', 'supplier', 'invoice', 'transfer', 'customer', 'sale', 'activityLog'];

        for (const model of models) {
            try {
                const total = await prisma[model].count();
                const withBusiness = await prisma[model].count({ where: { businessId: { not: null } } });
                const nullBusiness = await prisma[model].count({ where: { businessId: null } });

                console.log(`${model.toUpperCase()}: Total=${total}, WithBusiness=${withBusiness}, NullBusiness=${nullBusiness}`);
            } catch (e) {
                console.log(`${model.toUpperCase()}: Error - ${e.message}`);
            }
        }
    } catch (e) {
        console.error('Fatal error:', e.message);
    }

    await prisma.$disconnect();
}

check();
