const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetails() {
  try {
    const lastTransfers = await prisma.transfer.findMany({
      include: { 
        items: true,
        fromShop: true,
        toShop: true,
        fromWarehouse: true,
        toWarehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    console.log(JSON.stringify(lastTransfers, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetails();
