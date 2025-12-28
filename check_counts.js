const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const s = await prisma.sale.count();
    const t = await prisma.transfer.count();
    const c = await prisma.customer.count();
    console.log(`Sales: ${s}, Transfers: ${t}, Customers: ${c}`);
    await prisma.$disconnect();
}
check();
