'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const ROLE_REDIRECTS: Record<string, string> = {
  admin:       '/admin',
  cook:        '/cook',
  driver:      '/driver',
  beneficiary: '/beneficiary',
  'cook-driver': '/cook',
};

const VALID_ROLES = ['admin', 'cook', 'driver', 'beneficiary', 'cook-driver'] as const;
type DemoRole = typeof VALID_ROLES[number];

export default function DemoLoginPage() {
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roleParam = params?.role as DemoRole | undefined;

    if (!roleParam || !VALID_ROLES.includes(roleParam)) {
      setError('קישור דמו לא תקין');
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        setError(null);
        setLoading(true);

        // 1) S’assurer que l’utilisateur demo existe côté Supabase
        const res = await fetch(`/api/demo-login/${roleParam}`, { method: 'POST' });
        const json = await res.json();

        if (!res.ok) {
          setError(json?.error || 'שגיאה ביצירת משתמש הדמו');
          setLoading(false);
          return;
        }

        const { email, password } = json as { email: string; password: string };

        // 2) Connexion côté client avec email/password
        const supabase = createSupabaseBrowserClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !data.session) {
          setError(signInError?.message || 'לא הצלחנו להתחבר עם משתמש הדמו');
          setLoading(false);
          return;
        }

        // 3) Redirection vers le bon tableau de bord
        const dest = ROLE_REDIRECTS[roleParam] ?? '/';
        router.replace(dest);
      } catch (e) {
        console.error('Demo login error', e);
        setError('אירעה שגיאה בלתי צפויה בזמן התחברות הדמו');
        setLoading(false);
      }
    };

    run();
  }, [params, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-xl shadow-[#811453]/10 text-center space-y-4">
        <div className="text-4xl animate-bounce">💛</div>
        <h1 className="text-lg font-bold" style={{ color: '#811453' }}>
          מתחברות למשתמש דמו...
        </h1>
        {loading && (
          <p className="text-sm text-zinc-500">
            רגע, אנחנו מכינות עבורך משתמש בדיקות מתאים.
          </p>
        )}
        {error && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              type="button"
              className="mt-2 rounded-full border border-[#F7D4E2] px-4 py-2 text-xs font-semibold text-[#811453]"
              onClick={() => router.replace('/login')}
            >
              חזרה למסך ההתחברות
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

