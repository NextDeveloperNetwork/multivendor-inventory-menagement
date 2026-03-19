const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const product = await prisma.product.create({
            data: {
                name: "Test Product",
                sku: "TEST-SKU-" + Date.now(),
                price: 10.0,
                cost: 5.0,
                businessId: null // or a valid ID
            }
        });
        console.log("Product created:", product.id);

        const inventory = await prisma.inventory.create({
            data: {
                productId: product.id,
                warehouseId: null,
                shopId: null,
                quantity: 10
            }
        });
        console.log("Inventory created:", inventory.id);
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
