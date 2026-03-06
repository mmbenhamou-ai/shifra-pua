import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/debug/whoami — diagnostic auth côté serveur.
 * Ne retourne jamais de tokens ni secrets.
 */
export async function GET(req: NextRequest) {
  const hasCookie =
    req.headers.get('cookie') != null && req.headers.get('cookie')!.length > 0;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let profile: { id?: string; role?: string; approved?: boolean } | null = null;
  let profileError: { message?: string; code?: string; details?: string | null } | null = null;

  if (user) {
    const { data: row, error } = await supabase
      .from('users')
      .select('id, role, approved')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      profileError = {
        message: error.message,
        code: error.code,
        details: error.details ?? null,
      };
    }

    if (row) {
      profile = {
        id: row.id,
        role: row.role ?? undefined,
        approved: row.approved ?? undefined,
      };
    }
  }

  return NextResponse.json({
    hasCookie,
    userError: userError
  ? {
      message: userError.message,
      code: (userError as { code?: string | null } | null)?.code ?? null,
    }
  : null,
    user: user ? { id: user.id, email: user.email ?? null } : null,
    profile,
    profileError,
  });
}