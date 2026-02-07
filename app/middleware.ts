import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const protectedPaths = ['/admin', '/admin/*'];
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path.replace('/*', ''))
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL('/sign-in', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = 
      token.email === 'vadimbureev380@yandex.ru' ||
      token.id === '1' ||
      token.role === 'ADMIN' ||
      token.sub === '1';

    if (!isAdmin) {
      // Если не админ - редирект на главную или страницу 403
      const forbiddenUrl = new URL('/403', request.url);
      return NextResponse.redirect(forbiddenUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const loginUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Настройка для каких роутов применять middleware
export const config = {
  matcher: [
    /*
     * Матчим все роуты кроме:
     * - api/auth (NextAuth)
     * - статические файлы
     * - favicon.ico
     * - публичные файлы
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images|public).*)',
    '/admin/:path*',
  ],
};