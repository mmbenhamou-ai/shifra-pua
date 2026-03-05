import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/admin',
  '/beneficiary',
  '/cook',
  '/driver',
  '/profile',
  '/yoledet',
  '/volunteer',
];
// /test-login et /api/dev-login : autorisés SEULEMENT en développement
const PUBLIC = ['/login', '/signup', '/demo'];
const DEV_ONLY = ['/test-login', '/api/dev-login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';

  // Routes dev-only : bloquer en production
  if (DEV_ONLY.some((p) => pathname.startsWith(p))) {
    if (!isDev) {
      return new NextResponse('Not found', { status: 404 });
    }
    return NextResponse.next();
  }

  // Ignorer les routes publiques et les assets
  if (
    PUBLIC.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Vérifier si c'est une route protégée
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return res;

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
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // En développement : bypass login minimal (sans cookie user_role)
  if (!session && isDev) {
    res.cookies.set('dev_bypass', '1', { path: '/', maxAge: 60 * 60 * 24 });
    return res;
  }

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session valide : laisser passer, les pages server feront les contrôles de rôle/profil
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|sw\\.js|manifest\\.webmanifest).*)'],
};

