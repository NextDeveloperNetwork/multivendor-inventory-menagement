const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDeduction() {
  const transferId = 'cmnavzhax000112tvug1q4esn'; // 1q4esn
  const productId = 'cmnatm4bz0002dp9akgvvup4a'; // test123
  
  try {
    const originalTransfer = await prisma.transfer.findUnique({
        where: { id: transferId }
    });
    
    console.log('Original Transfer toShopId:', originalTransfer.toShopId);
    
    const shopInv = await prisma.inventory.findFirst({
        where: { 
            productId: productId, 
            shopId: originalTransfer.toShopId 
        }
    });
    
    console.log('Found Shop Inventory:', shopInv);
    
    if (shopInv) {
        console.log('Stock would be decremented from:', shopInv.quantity);
    } else {
        console.log('SHOP INVENTORY RECORD NOT FOUND!');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

debugDeduction();
