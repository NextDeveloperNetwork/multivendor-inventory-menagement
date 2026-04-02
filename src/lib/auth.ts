import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log(`\n[AUTH] Attempting login for: ${credentials?.email}`);
                if (!credentials?.email || !credentials?.password) {
                    console.log(`[AUTH] Missing email or password`);
                    return null;
                }

                try {
                    console.log(`[AUTH] Querying database...`);
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user) {
                        console.log(`[AUTH] ❌ User not found in DB: ${credentials.email}`);
                        return null;
                    }

                    console.log(`[AUTH] ✅ User retrieved: ${user.email} (Role: ${user.role})`);
                    console.log(`[AUTH] Comparing passwords...`);
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        console.log(`[AUTH] ❌ Password mismatch for: ${credentials.email}`);
                        return null;
                    }

                    console.log(`[AUTH] ✅ Successful login: ${user.email}`);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        shopId: user.shopId,
                        transporterId: (user as any).transporterId,
                    };
                } catch (error) {
                    console.error('[AUTH] 💥 DATABASE ERROR during login:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.shopId = (user as any).shopId;
                token.transporterId = (user as any).transporterId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).shopId = token.shopId;
                (session.user as any).transporterId = token.transporterId;
            }
            return session;
        },
    },
};
