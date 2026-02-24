'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Stage = 'phone' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setError('נא להזין מספר טלפון');
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          channel: 'sms',
        },
      });

      if (otpError) {
        setError(otpError.message || 'שגיאה בשליחת קוד ה-SMS');
        return;
      }

      setStage('code');
    } catch (err) {
      setError('אירעה שגיאה בלתי צפויה. נסי שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedPhone = phone.trim();
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('נא להזין את הקוד שנשלח אלייך');
      return;
    }

    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: trimmedCode,
        type: 'sms',
      });

      if (verifyError || !data.session) {
        setError(verifyError?.message || 'קוד לא תקין, נא לנסות שוב');
        return;
      }

      const userId = data.session.user.id;

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        setError('שגיאה בטעינת פרטי המשתמש');
        return;
      }

      if (!userProfile) {
        router.replace('/signup');
        return;
      }

      const { role } = userProfile as { role: string };

      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'beneficiary') {
        router.replace('/beneficiary');
      } else if (role === 'cook') {
        router.replace('/cook');
      } else if (role === 'driver') {
        router.replace('/driver');
      } else {
        router.replace('/');
      }
    } catch (err) {
      setError('אירעה שגיאה בלתי צפויה. נסי שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8" dir="rtl">
        <h1 className="text-2xl font-bold mb-6 text-right">כניסה למערכת</h1>

        {stage === 'phone' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="flex flex-col items-end gap-1">
              <label htmlFor="phone" className="text-sm font-medium">
                מספר טלפון
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-right">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'שולחת קוד...' : 'שלחי לי קוד ב-SMS'}
            </button>
          </form>
        )}

        {stage === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-right text-sm text-zinc-600">
              שלחנו לך קוד SMS ל־{phone}. נא להקליד אותו כאן:
            </p>

            <div className="flex flex-col items-end gap-1">
              <label htmlFor="code" className="text-sm font-medium">
                קוד אימות
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                dir="ltr"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.3em]"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-right">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'מאמתת...' : 'כניסה'}
            </button>

            <button
              type="button"
              className="w-full text-sm text-right text-blue-700 underline"
              onClick={() => setStage('phone')}
            >
              להחליף מספר טלפון
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

