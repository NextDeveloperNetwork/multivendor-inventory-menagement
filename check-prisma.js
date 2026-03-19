const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Available Prisma models:', Object.keys(prisma).filter(k => k[0] === k[0].toLowerCase() && !k.startsWith('_')));
process.exit(0);
