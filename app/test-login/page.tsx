'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function TestLoginPage() {
  const router = useRouter();

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="flex min-h-screen items-center justify-center" dir="rtl">
        <p className="text-zinc-500">דף זה אינו זמין בסביבת ייצור.</p>
      </div>
    );
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (process.env.NODE_ENV === 'production') {
      setError('עמוד זה זמין רק בסביבת פיתוח');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/dev-login', {
        method: 'POST',
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'שגיאה בהתחברות פיתוח');
        setLoading(false);
        return;
      }

      const { email, password } = json as {
        email: string;
        password: string;
      };

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !data.session) {
        setError(signInError?.message || 'לא הצלחנו ליצור סשן התחברות');
        setLoading(false);
        return;
      }

      router.replace('/admin');
    } catch (err) {
      setError('אירעה שגיאה בלתי צפויה. נסי שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} style={{ width: 320 }} dir="rtl">
        <h1 style={{ textAlign: 'right', marginBottom: 16 }}>כניסה לפיתוח</h1>
        <p style={{ textAlign: 'right', marginBottom: 16 }}>
          התחברות עם משתמש בדיקות קבוע (email/password).
        </p>

        {error && (
          <p style={{ color: 'red', textAlign: 'right', marginBottom: 8 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 8 }}
        >
          {loading ? 'מתחברת...' : 'כניסה כ-admin (DEV)'}
        </button>
      </form>
    </div>
  );
}

