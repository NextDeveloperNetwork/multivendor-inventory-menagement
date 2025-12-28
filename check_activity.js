const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const a = await prisma.activityLog.count();
    console.log(`Activity Logs: ${a}`);
    await prisma.$disconnect();
}
check();
