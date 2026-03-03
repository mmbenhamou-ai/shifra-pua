import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/admin', '/beneficiary', '/cook', '/driver', '/profile'];
const PUBLIC = ['/login', '/signup', '/test-login', '/api/dev-login', '/demo'];

const ROLE_ROUTE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/cook', roles: ['cook', 'both'] },
  { prefix: '/driver', roles: ['driver', 'both'] },
  { prefix: '/beneficiary', roles: ['beneficiary'] },
];

function getDashboardForRole(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'cook':
    case 'both': return '/cook';
    case 'driver': return '/driver';
    case 'beneficiary': return '/beneficiary';
    default: return '/';
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  const isDev = process.env.NODE_ENV === 'development';

  // En dev : poser le bypass sur / pour que l'accueil redirige vers /admin
  if (isDev && pathname === '/') {
    res.cookies.set('dev_bypass', '1', { path: '/', maxAge: 60 * 60 * 24 });
    res.cookies.set('user_role', 'admin', { path: '/', maxAge: 60 * 60 * 24 });
    return res;
  }

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

  const { data: { session } } = await supabase.auth.getSession();

  // En développement : bypass login — accès direct à toutes les URLs avec un rôle déduit du path
  if (!session && isDev) {
    const roleFromPath =
      pathname.startsWith('/admin') ? 'admin' :
        pathname.startsWith('/cook') ? 'cook' :
          pathname.startsWith('/driver') ? 'driver' :
            pathname.startsWith('/beneficiary') ? 'beneficiary' :
              pathname.startsWith('/profile') ? 'admin' : 'admin';
    res.cookies.set('dev_bypass', '1', { path: '/', maxAge: 60 * 60 * 24 });
    res.cookies.set('user_role', roleFromPath, { path: '/', maxAge: 60 * 60 * 24 });
    return res;
  }

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC : déterminer le rôle utilisateur, avec cache dans un cookie
  let role = req.cookies.get('user_role')?.value ?? null;

  if (!role) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    role = (user?.role as string | undefined) ?? null;
    if (!role) {
      // Utilisatrice sans enregistrement users → renvoyer vers signup
      return NextResponse.redirect(new URL('/signup', req.url));
    }

    res.cookies.set('user_role', role, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1 heure
    });
  }

  const rule = ROLE_ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (rule && !rule.roles.includes(role)) {
    const target = getDashboardForRole(role);
    return NextResponse.redirect(new URL(target, req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|sw\\.js|manifest\\.webmanifest).*)'],
};
