import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/debug/whoami — diagnostic auth côté serveur.
 * Ne retourne jamais de tokens ni secrets.
 */
export async function GET(req: NextRequest) {
  const hasCookie = req.headers.get('cookie') != null && req.headers.get('cookie')!.length > 0;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { id?: string; role?: string; approved?: boolean } | null = null;
  if (user) {
    const { data: row } = await supabase
      .from('users')
      .select('id, role, approved')
      .eq('id', user.id)
      .maybeSingle();
    if (row) {
      profile = { id: row.id, role: row.role ?? undefined, approved: row.approved ?? undefined };
    }
  }

  return NextResponse.json({
    hasCookie,
    user: user ? { id: user.id, email: user.email ?? null } : null,
    profile,
  });
}
