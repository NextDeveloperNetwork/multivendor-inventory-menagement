'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logActivity } from './intelligence';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

export async function registerUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const result = registerSchema.safeParse({ email, password, name });

    if (!result.success) {
        return { error: 'Invalid input data' };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: 'User already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        /*
          Logic explained:
          First user created will be ADMIN?
          User requested: "new user logs in its automatically a user".
          But we need at least one ADMIN.
          I will make the FIRST user an ADMIN for bootstrapping, 
          otherwise everyone is USER.
        */
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'ADMIN' : 'USER';

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
            },
        });

        await logActivity({
            action: 'USER_REGISTERED',
            entityType: 'USER',
            entityId: user.id,
            details: `New account created: ${email}. Initial role: ${role}`
        });

        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Something went wrong' };
    }
}
