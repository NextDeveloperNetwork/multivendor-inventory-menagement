const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true }
    });
    console.log('Users:', users);
    process.exit(0);
}

checkUsers();
