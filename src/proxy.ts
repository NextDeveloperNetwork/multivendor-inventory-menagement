import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token;
        const isAuth = !!token && !!token.id;
        const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');

        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL('/', req.url));
            }
            return null;
        }

        if (!isAuth) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        if (req.nextUrl.pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/shop', req.url));
        }

        if ((token as any)?.role === 'SALES_MANAGER' && req.nextUrl.pathname === '/') {
            return NextResponse.redirect(new URL('/sales', req.url));
        }

        const allowedPaths = (token as any)?.allowedPaths || [];
        if (allowedPaths.length > 0) {
            const currentPath = req.nextUrl.pathname;
            // Strict routing: they can only access paths explicitly allowed via their string path prefix
            const isAllowed = allowedPaths.some((p: string) => currentPath === p || currentPath.startsWith(p + '/'));
            if (!isAllowed) {
                const fallback = allowedPaths[0] || '/';
                return NextResponse.redirect(new URL(fallback, req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow login/register pages to be accessed even if not authenticated
                // The middleware function body above will handle redirecting IF they ARE authenticated
                if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')) {
                    return true;
                }
                return !!token && !!token.id;
            },
        },
    }
);

export const config = {
    matcher: ['/', '/sales/:path*', '/admin/:path*', '/shop/:path*', '/login', '/register'],
};
