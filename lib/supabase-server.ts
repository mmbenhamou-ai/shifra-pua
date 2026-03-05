import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from './supabase';
import type { Database } from './database.types';

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}

