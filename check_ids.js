const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const sale = await prisma.sale.findFirst();
    const transfer = await prisma.transfer.findFirst();
    const shop = await prisma.shop.findFirst();
    console.log('Sale BusinessId:', sale?.businessId);
    console.log('Transfer BusinessId:', transfer?.businessId);
    console.log('Shop BusinessId:', shop?.businessId);
    await prisma.$disconnect();
}
check();
