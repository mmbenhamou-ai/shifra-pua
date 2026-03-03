import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const DEV_BYPASS_USER_ID = '00000000-0000-0000-0000-000000000001';

export type DevBypassUser = {
  id: string;
  role: string;
  approved: boolean;
  also_driver?: boolean;
};

/**
 * En développement : si le cookie dev_bypass est posé (middleware), retourne une session/user fictifs
 * pour permettre de naviguer sans login. En production, comportement normal (session + user depuis la DB).
 */
export async function getSessionOrDevBypass(): Promise<{
  session: { user: { id: string } } | null;
  user: DevBypassUser | null;
}> {
  const isDev = process.env.NODE_ENV === 'development';
  const cookieStore = await cookies();
  const devBypass = cookieStore.get('dev_bypass')?.value === '1';
  const devRole = cookieStore.get('user_role')?.value ?? 'admin';

  if (isDev && devBypass && devRole) {
    return {
      session: { user: { id: DEV_BYPASS_USER_ID } },
      user: {
        id: DEV_BYPASS_USER_ID,
        role: devRole,
        approved: true,
        also_driver: devRole === 'driver' || devRole === 'both',
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, user: null };

  const { data: user } = await supabase
    .from('users')
    .select('id, role, approved, also_driver')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    session: session as { user: { id: string } },
    user: user ? { id: user.id, role: user.role, approved: user.approved ?? false, also_driver: user.also_driver ?? false } : null,
  };
}
