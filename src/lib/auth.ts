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
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    console.log(`[AUTH] Password mismatch for: ${credentials.email}`);
                    return null;
                }

                console.log(`[AUTH] Successful login: ${user.email} (Role: ${user.role})`);
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    shopId: user.shopId,
                    transporterId: (user as any).transporterId,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Fresh data sync
            if (token.id) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true, shopId: true, transporterId: true } as any
                });
                if (freshUser) {
                    const fu = freshUser as any;
                    token.role = fu.role;
                    token.shopId = fu.shopId;
                    token.transporterId = fu.transporterId;
                }
            }

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
