'use client';
// Login: Google (lien fallback) + bouton Test sur localhost / vercel.app

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Heart } from 'lucide-react';

const isTestLoginAvailable = () => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return (
    h === 'localhost' ||
    h.endsWith('.vercel.app') ||
    process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === 'true'
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }

  const handleGoogleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    console.log('[login] click google');
    setLoading(true);
    setError(null);

    try {
      let supabase;
      try {
        supabase = getSupabase();
      } catch (err) {
        console.error('[login] getSupabase failed', err);
        throw err;
      }

      console.log('[login] before oauth', {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('[login] oauth result', { data, error });

      if (error) {
        throw error;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('לא התקבל קישור להתחברות');
    } catch (err: unknown) {
      console.error('[login]', err);
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות עם גוגל');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isTestLoginAvailable()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.email || !json.password) {
        throw new Error(json.error || 'כניסת בדיקה לא זמינה');
      }
      const supabase = getSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: json.email,
        password: json.password,
      });
      if (signInError) throw signInError;
      if (data.session) {
        router.replace('/');
        return;
      }
      throw new Error('לא נוצרה התחברות');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בכניסת בדיקה');
      console.error('[login] test', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5f8]"
      dir="rtl"
    >
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#91006A]/10 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-[#91006A]" />
          </div>
          <h1 className="text-slate-900 text-3xl font-bold text-center">ברוכים הבאים</h1>
          <p className="text-slate-600 text-base mt-2 text-center">
            למערכת שפרה ופועה - ניהול ארוחות ליולדות
          </p>
        </div>

        <div className="space-y-6">
          <a
            href="/api/auth/google"
            role="button"
            data-login="google"
            onClick={(e) => {
              e.preventDefault();
              handleGoogleLogin(e as unknown as React.MouseEvent<HTMLButtonElement>);
            }}
            className="w-full bg-white border-2 border-slate-200 hover:border-[#91006A] text-slate-700 font-bold h-[56px] min-h-[56px] transition-all flex items-center justify-center gap-4 rounded-xl shadow-sm active:scale-95 cursor-pointer disabled:opacity-70 box-border no-underline"
            style={{ pointerEvents: loading ? 'none' : undefined }}
          >
            <img src="/google-icon.svg" alt="Google" width={24} height={24} />
            <span>{loading ? 'טוען...' : 'המשך עם Google'}</span>
          </a>

          {isTestLoginAvailable() && (
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full bg-slate-100 border border-slate-300 text-slate-600 font-medium h-12 rounded-xl text-sm hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-70"
            >
              כניסה לבדיקה (Test)
            </button>
          )}

          {error && (
            <p className="bg-red-50 text-red-700 p-4 rounded-xl text-sm text-center">
              {error}
            </p>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            בהתחברות למערכת את מסכימה לתנאי השימוש
          </p>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#91006A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#91006A]/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}