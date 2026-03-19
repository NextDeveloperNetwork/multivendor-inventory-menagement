const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    const id = "cmmxq5vrh000415xe1ab37ka0"; // Use an existing ID
    console.log(`Testing update for product ${id}`);
    
    try {
        const res = await prisma.product.update({
            where: { id },
            data: {
                name: "Test Update",
                isPriceManual: true
            }
        });
        console.log('Update success:', res.id);
    } catch (e) {
        console.error('Update failed HUGE ERROR:', e.message);
    }
    await prisma.$disconnect();
}

testUpdate();
