import type { SupabaseClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

if (process.env.NODE_ENV === 'production' && !process.env.WEBHOOK_SECRET) {
  throw new Error('WEBHOOK_SECRET must be defined in production');
}

export const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export type { SupabaseClient };
