import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
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

        // User is logged in but tries to access shop without being assigned?
        // Use logic here or in page. For now, allow access, page will handle "No Shop Assigned".
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow login/register pages to be accessed even if not authenticated
                // The middleware function body above will handle redirecting IF they ARE authenticated
                if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')) {
                    return true;
                }
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ['/admin/:path*', '/shop/:path*', '/login', '/register'],
};
