const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- BUSINESS DATA DISTRIBUTION ---');

    const businesses = await prisma.business.findMany();
    const bdMap = {};
    businesses.forEach(b => bdMap[b.id] = b.name);

    const models = ['product', 'shop', 'warehouse', 'supplier', 'invoice', 'transfer', 'customer', 'sale'];

    for (const model of models) {
        const counts = await prisma[model].groupBy({
            by: ['businessId'],
            _count: true
        });
        console.log(`${model.toUpperCase()}:`);
        counts.forEach(c => {
            console.log(`  - Business: ${bdMap[c.businessId] || 'NULL/UNKNOWN'} (${c.businessId}): ${c._count}`);
        });
    }

    await prisma.$disconnect();
}

check();
