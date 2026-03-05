import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createSupabaseServerClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Pour la V1 Phase 6, on se contente de créer la session
  // et on laisse les pages protégées / layouts décider de la redirection
  // en fonction de la table `users` et du champ `approved`.
  return NextResponse.redirect(`${origin}/`);
}
