import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

const testEmail = process.argv[2] || 'admin@finance.com';
const testPassword = process.argv[3] || 'admin123';

console.log(`\n🔍 Testing auth for: ${testEmail}`);

try {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!user) {
        console.log(`❌ User NOT FOUND in database: ${testEmail}`);
        console.log('\n📋 All users in DB:');
        const all = await prisma.user.findMany({ select: { email: true, role: true } });
        all.forEach(u => console.log(`   ${u.email} (${u.role})`));
    } else {
        console.log(`✅ User FOUND: ${user.email} | Role: ${user.role}`);
        const match = await bcrypt.compare(testPassword, user.password);
        console.log(`🔑 Password "${testPassword}" match: ${match ? '✅ CORRECT' : '❌ WRONG'}`);
        if (!match) {
            console.log('   The password stored in DB does not match what you entered.');
        }
    }
} catch (e) {
    console.error('💥 DB Error:', e.message);
} finally {
    await prisma.$disconnect();
}
