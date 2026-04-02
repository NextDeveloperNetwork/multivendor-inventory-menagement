const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogs() {
  const logs = await prisma.productionLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('RECORDS:', JSON.stringify(logs, null, 2));

  const aggregation = await prisma.productionLog.aggregate({
    _sum: { quantity: true }
  });
  console.log('TOTAL SUM:', aggregation._sum.quantity);

  const articles = await prisma.productionArticle.findMany({ take: 5 });
  console.log('ARTICLES:', articles.map(a => a.name));
}

checkLogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
