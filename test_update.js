const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    const id = "cmmxq5vrh000415xe1ab37ka0"; // "ff" from the output
    const newPrice = 1500;
    
    console.log(`Updating product ${id} to price ${newPrice}`);
    
    try {
        const current = await prisma.product.findUnique({ where: { id } });
        console.log('Current price:', current.price, 'Manual:', current.isPriceManual);
        
        const updateData = { price: newPrice };
        if (Number(current.price) !== newPrice) {
            updateData.isPriceManual = true;
        }
        
        const updated = await prisma.product.update({
            where: { id },
            data: updateData
        });
        
        console.log('Updated price:', updated.price, 'Manual:', updated.isPriceManual);
    } catch (e) {
        console.error('Update failed:', e.message);
    }
    
    await prisma.$disconnect();
}

testUpdate();
