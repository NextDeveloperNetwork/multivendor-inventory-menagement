const { prisma } = require('./src/lib/prisma');

async function check() {
    console.log('Product Model Delegate Keys:', Object.keys(prisma.product || {}));
    await prisma.$disconnect();
}

check();
