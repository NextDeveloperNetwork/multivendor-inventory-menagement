const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const dbUrl = process.env.DATABASE_URL || '';
console.log('DATABASE_URL length:', dbUrl.length);
const connectionString = dbUrl.replace(/'/g, '');
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('USERS IN DB:');
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
  } catch (err) {
    console.error('ERROR CHECKING USERS:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
