import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

// WEBHOOK_SECRET : vérifier dans les routes webhook qui en ont besoin, pas au chargement du module
// (sinon le build Vercel échoue si la variable n'est pas définie au moment du build)

export const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export type TypedSupabaseClient = SupabaseClient<Database>;
