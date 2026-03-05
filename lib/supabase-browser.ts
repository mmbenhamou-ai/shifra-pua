'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase';
import type { Database } from './database.types';

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

