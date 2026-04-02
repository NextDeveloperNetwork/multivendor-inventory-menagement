const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCol() {
  try {
    const res = await prisma.$queryRaw`
      SELECT column_name, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ProductionArticle' AND column_name = 'sku'
    `;
    console.table(res);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
checkCol();
