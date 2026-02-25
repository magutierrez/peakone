import { auth } from './auth';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const nextIntlMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'never',
});

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users to login
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/api/auth');

  if (!session?.user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Apply next-intl middleware for i18n

  // if (pathname.startsWith('/login')) { // Temporarily skip nextIntlMiddleware for /login

  //   return NextResponse.next();

  // }

  // return nextIntlMiddleware(request); // Temporarily disabled completely

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
