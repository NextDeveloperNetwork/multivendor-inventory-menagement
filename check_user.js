const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const email = process.argv[2];
    if (!email) {
        console.log("Usage: node check_user.js <email>");
        process.exit(1);
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log(`User found: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`ShopId: ${user.shopId}`);
        console.log(`TransporterId: ${user.transporterId}`);
    } else {
        console.log(`User NOT found: ${email}`);
    }
    process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
