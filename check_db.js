const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transfer'
    `;
    console.log('Columns in Transfer table:');
    console.table(result);
  } catch (e) {
    console.error('Error checking columns:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
