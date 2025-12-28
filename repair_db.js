const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
    console.log('--- REPAIRING DATABASE (Multi-Tenancy Alignment) ---');

    let mainBusiness = await prisma.business.findFirst({
        where: { name: 'Main Business' }
    });

    if (!mainBusiness) {
        console.log('Main Business not found, creating...');
        mainBusiness = await prisma.business.create({
            data: { name: 'Main Business' }
        });
    }

    console.log(`Using Business: ${mainBusiness.name} (${mainBusiness.id})`);

    const models = ['product', 'shop', 'warehouse', 'supplier', 'invoice', 'transfer', 'customer', 'sale', 'activityLog'];

    for (const model of models) {
        try {
            console.log(`Processing ${model}...`);
            const result = await prisma[model].updateMany({
                where: { businessId: null },
                data: { businessId: mainBusiness.id }
            });
            console.log(`  ${model.toUpperCase()}: Updated ${result.count} records.`);
        } catch (e) {
            console.error(`  ${model.toUpperCase()}: Failed - ${e.message}`);
        }
    }

    console.log('Alignment complete.');
    await prisma.$disconnect();
}

repair();
