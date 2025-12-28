const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const models = ['warehouse', 'supplier', 'invoice', 'transfer', 'customer', 'sale'];
    for (const model of models) {
        try {
            const total = await prisma[model].count();
            const withB = await prisma[model].findMany({ where: { NOT: { businessId: null } } });
            const withoutB = await prisma[model].findMany({ where: { businessId: null } });
            console.log(`${model}: Total=${total}, With=${withB.length}, Without=${withoutB.length}`);
        } catch (e) {
            const total = await prisma[model].count();
            console.log(`${model}: Total=${total} (Error checking businessId: ${e.message})`);
        }
    }
    await prisma.$disconnect();
}
check();
