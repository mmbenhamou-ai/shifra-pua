'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase';

export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

