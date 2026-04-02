const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArticles() {
  try {
    const total = await prisma.productionArticle.count();
    const articles = await prisma.productionArticle.findMany({
        take: 50,
        select: { id: true, name: true, sku: true, type: true }
    });
    console.log('Total production articles in database:', total);
    console.table(articles);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticles();
