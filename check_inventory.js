const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const inv = await prisma.inventory.count();
    console.log(`Inventory Items: ${inv}`);
    const invWithQuantity = await prisma.inventory.count({ where: { quantity: { gt: 0 } } });
    console.log(`Items with Quantity > 0: ${invWithQuantity}`);
    await prisma.$disconnect();
}
check();
