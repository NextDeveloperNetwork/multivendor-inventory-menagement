const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const filter = {}; // Simulating no business selected
    console.log('--- TESTING GLOBAL VIEW (filter={}) ---');

    const products = await prisma.product.count({ where: filter });
    const shops = await prisma.shop.findMany({ where: filter });
    const sales = await prisma.sale.findMany({ where: filter });

    console.log(`Global Products: ${products}`);
    console.log(`Global Shops: ${shops.length}`);
    console.log(`Global Sales: ${sales.length}`);

    const bizId = 'cmjpoloif0000nqrvwae76amg';
    const filterB = { businessId: bizId };
    console.log(`--- TESTING MAIN BUSINESS VIEW (filterB=${bizId}) ---`);

    const productsB = await prisma.product.count({ where: filterB });
    const shopsB = await prisma.shop.findMany({ where: filterB });
    const salesB = await prisma.sale.findMany({ where: filterB });

    console.log(`Main Biz Products: ${productsB}`);
    console.log(`Main Biz Shops: ${shopsB.length}`);
    console.log(`Main Biz Sales: ${salesB.length}`);

    await prisma.$disconnect();
}

check();
