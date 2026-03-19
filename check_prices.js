const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const products = await prisma.product.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, price: true, cost: true, isPriceManual: true }
        });
        console.log('Recent products:', JSON.stringify(products, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    await prisma.$disconnect();
}

check();
