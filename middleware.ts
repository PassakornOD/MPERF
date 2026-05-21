import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Allow access to login page and authentication APIs
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Redirect to login if not authenticated
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const userRole = (token as any)?.role;

  // 3. Define Group 2 Routes (Restricted to admin and sysadmin)
  const group2Prefixes = [
    '/report/templates',
    '/inventory/manage',
    '/admin'
  ];

  const isGroup2Route = group2Prefixes.some(prefix => pathname.startsWith(prefix));

  if (isGroup2Route) {
    // Only allow if role is admin or sysadmin
    if (userRole !== 'admin' && userRole !== 'sysadmin') {
      const url = req.nextUrl.clone();
      url.pathname = '/'; // Redirect to dashboard if unauthorized
      return NextResponse.redirect(url);
    }
  }

  // 4. Group 1 routes and all others for authenticated users are allowed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
