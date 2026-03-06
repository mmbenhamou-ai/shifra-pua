import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { toNextCookieOptions } from '@/lib/supabase-cookie-options';

const PROTECTED_PREFIXES = [
  '/admin',
  '/beneficiary',
  '/cook',
  '/driver',
  '/profile',
  '/yoledet',
  '/volunteer',
];
const PUBLIC = ['/login', '/signup', '/demo', '/debug'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';

  if (pathname.startsWith('/api/dev-login')) {
    if (isDev || process.env.ALLOW_DEV_LOGIN_IN_PROD === 'true') {
      return NextResponse.next();
    }
    return new NextResponse('Not found', { status: 404 });
  }
  if (pathname.startsWith('/test-login')) {
    if (!isDev) return new NextResponse('Not found', { status: 404 });
    return NextResponse.next();
  }

  if (
    PUBLIC.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/debug') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return res;

  const hasCookie = req.headers.get('cookie') != null && req.headers.get('cookie')!.length > 0;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const nextOpts = toNextCookieOptions(options as Record<string, unknown>);
            res.cookies.set(name, value, {
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              ...nextOpts,
            });
          });
        },
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  console.log('[middleware]', {
    pathname,
    hasCookie,
    userPresent: !!authUser,
    decision: authUser ? 'allow' : (isDev ? 'dev_bypass' : 'redirect_login'),
  });

  if (!authUser && isDev) {
    res.cookies.set('dev_bypass', '1', { path: '/', maxAge: 60 * 60 * 24 });
    return res;
  }

  if (!authUser) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|sw\\.js|manifest\\.webmanifest).*)'],
};
