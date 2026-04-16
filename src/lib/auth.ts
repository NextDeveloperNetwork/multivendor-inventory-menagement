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
                        sessionVersion: (user as any).sessionVersion,
                        allowedPaths: (user as any).allowedPaths,
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
                token.sessionVersion = (user as any).sessionVersion;
                token.allowedPaths = (user as any).allowedPaths || [];
                return token;
            }

            // Real-time block check & allowedPaths update
            if (token.id) {
                try {
                    // We must fetch raw if standard find doesn't type check
                    const rawUser = await prisma.user.findUnique({
                        where: { id: token.id as string }
                    }) as any;
                    
                    if (!rawUser || rawUser.sessionVersion !== token.sessionVersion) {
                        // Invalidate token stringly
                        token.id = '';
                        token.role = 'USER' as any;
                        token.sessionVersion = -1;
                    } else {
                        token.allowedPaths = rawUser.allowedPaths;
                        token.role = rawUser.role;
                    }
                } catch (e) {
                    // Fallback to token if DB unreachable
                }
            }

            return token;
        },
        async session({ session, token }) {
            // If token was wiped or is invalid, return a session without user data
            if (!token || !token.id || token.sessionVersion === -1) {
                return { expires: session.expires } as any;
            }
            
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).shopId = token.shopId;
                (session.user as any).transporterId = token.transporterId;
                (session.user as any).sessionVersion = token.sessionVersion;
                (session.user as any).allowedPaths = token.allowedPaths;
            }
            return session;
        },
    },
};
