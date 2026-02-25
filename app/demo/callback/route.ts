import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ROLE_REDIRECTS: Record<string, string> = {
  admin:       '/admin',
  cook:        '/cook',
  driver:      '/driver',
  beneficiary: '/beneficiary',
};

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const role = searchParams.get('role') ?? 'cook';
  const dest = ROLE_REDIRECTS[role] ?? '/';

  // Supabase envoie un ?code= (flow PKCE) quand redirectTo est défini
  if (!code) {
    // Pas de code : rediriger vers une page client qui lit le fragment #access_token
    return NextResponse.redirect(`${origin}/demo/session?role=${role}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(`${origin}/demo/session?role=${role}`);
  }

  return NextResponse.redirect(`${origin}${dest}`);
}
