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
    const requestedRole = formData.get('requestedRole') as string;

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

        const userCount = await prisma.user.count();
        let role: any = userCount === 0 ? 'ADMIN' : 'USER';
        let isApproved = true;

        if (requestedRole === 'POSTAL_MANAGER') {
            role = 'POSTAL_MANAGER';
            isApproved = false;
        }

        const user = await (prisma.user as any).create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                isApproved
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
