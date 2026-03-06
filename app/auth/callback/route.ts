import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  const redirectUrl = new URL(next, url.origin);
  const response = NextResponse.redirect(redirectUrl);

  if (!code) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        response.cookies.set(name, value, options ?? {});
      },
      remove(name: string, options?: Record<string, unknown>) {
        response.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Optionnel: log serveur Vercel
    // console.error('exchangeCodeForSession error:', error.message);
  }

  return response;
}
