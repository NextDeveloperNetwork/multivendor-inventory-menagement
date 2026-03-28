const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStock() {
  try {
    const inventories = await prisma.inventory.findMany({
      include: {
        product: true,
        shop: true,
        warehouse: true
      }
    });
    console.log('--- Current Inventory Snapshot ---');
    console.table(inventories.map(inv => ({
      Node: inv.warehouse?.name || inv.shop?.name || 'Unknown',
      Product: inv.product.name,
      Qty: inv.quantity
    })));

    const transfers = await prisma.transfer.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: { items: true }
    });
    console.log('--- Recent Transfers ---');
    console.table(transfers.map(tr => ({
        ID: tr.id.slice(-6),
        Status: tr.status,
        IsReturn: tr.isReturn,
        Amount: tr.totalAmount
    })));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkStock();
