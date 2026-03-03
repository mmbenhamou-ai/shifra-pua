import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS.
 * Use ONLY in Server Actions and API routes, never in client code.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[SECURITY] createAdminClient() ne peut être appelé que côté serveur. ' +
      'Vérifie que ton fichier n\'est pas marqué "use client".',
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase service role env vars');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
