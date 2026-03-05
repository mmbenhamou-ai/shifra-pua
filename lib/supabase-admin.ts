import { createClient } from '@supabase/supabase-js';

/**
 * Client avec SUPABASE_SERVICE_ROLE_KEY — contourne les RLS.
 *
 * RÈGLE SÉCURITÉ : cette clé ne doit être utilisée que depuis :
 * - scripts internes
 * - cron jobs (ex. app/api/cron/*)
 * - migrations
 * - tâches backend isolées (ex. app/api/webhooks/*)
 *
 * Ne pas utiliser dans : app/* (pages/composants), server actions, middleware,
 * ni dans les API routes appelées par le front (ex. /api/admin/export).
 * Préférer createSupabaseServerClient() + RLS + RPC.
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
