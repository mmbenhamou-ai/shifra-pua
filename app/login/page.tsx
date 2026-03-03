'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Stage = 'phone' | 'code';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return '+' + digits;
  if (digits.startsWith('0')) return '+972' + digits.slice(1);
  return '+972' + digits;
}

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
    const normalized = normalizePhone(phone.trim());
    if (!phone.trim()) { setError('נא להזין מספר טלפון'); return; }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { channel: 'sms' },
      });
      if (otpError) { setError(otpError.message || 'שגיאה בשליחת קוד ה-SMS'); return; }
      setStage('code');
    } catch {
      setError('אירעה שגיאה בלתי צפויה. נסי שוב.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizePhone(phone.trim());
    const trimmedCode = code.trim();
    if (!trimmedCode) { setError('נא להזין את הקוד'); return; }

    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: trimmedCode,
        type: 'sms',
      });
      if (verifyError || !data.session) {
        setError(verifyError?.message || 'קוד לא תקין, נסי שוב');
        return;
      }
      const { data: profile } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (!profile) { router.replace('/signup'); return; }
      if (!profile.approved) { router.replace('/signup/pending'); return; }

      const routes: Record<string, string> = {
        admin: '/admin', beneficiary: '/beneficiary',
        cook: '/cook', driver: '/driver',
      };
      router.replace(routes[profile.role as string] ?? '/');
    } catch {
      setError('אירעה שגיאה בלתי צפויה. נסי שוב.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5f8]"
      dir="rtl"
    >
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center p-4 justify-between">
          <button
            type="button"
            className="text-[#91006A] p-2 hover:bg-[#91006A]/10 rounded-full transition-colors"
            onClick={() => router.replace('/')}
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <h2 className="text-[#91006A] text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-8">
            התחברות
          </h2>
        </div>

        <div className="px-6 pt-8 pb-4 flex flex-col items-center">
          <div className="w-24 h-24 bg-[#91006A]/10 rounded-full flex items-center justify-center mb-6 aspect-square">
            <span className="material-symbols-outlined text-[#91006A] text-5xl">volunteer_activism</span>
          </div>
          <h1 className="text-slate-900 text-3xl font-bold leading-tight text-center">שלום!</h1>
          <p className="text-slate-600 text-base font-normal leading-normal mt-2 text-center">
            הזינו את מספר הטלפון כדי להתחבר למערכת
          </p>
        </div>

        {/* Zone formulaire principale – écran Stitch pour l’étape téléphone */}
        <div className="px-6 py-4 space-y-6">
          {stage === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-medium pr-1">
                  מספר טלפון
                </label>
                <div className="relative flex items-center">
                  <input
                    className="form-input block w-full border-slate-200 bg-slate-50 h-14 pl-12 pr-6 transition-all text-left placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-[#91006A] focus:border-[#91006A]"
                    dir="ltr"
                    placeholder="05X-XXXXXXX"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="absolute right-4 text-slate-400">
                    <span className="material-symbols-outlined">phone_iphone</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-right text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#91006A] hover:bg-[#91006A]/90 text-white font-bold h-14 shadow-lg shadow-[#91006A]/20 transition-all flex items-center justify-center gap-2 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">send</span>
                <span>{loading ? '...שולחת קוד' : 'שלחו לי קוד אימות'}</span>
              </button>

              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="flex-shrink mx-4 text-slate-400 text-sm">או</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              </div>

              {/* Bouton “magic link” – pour l’instant décoratif, on garde le style Stitch */}
              <button
                type="button"
                className="w-full bg-white border-2 border-[#91006A]/20 hover:border-[#91006A] text-[#91006A] font-semibold h-14 transition-all flex items-center justify-center gap-2 rounded-lg"
                onClick={() => alert('ממש בקרוב!')}
              >
                <span className="material-symbols-outlined text-xl">magic_button</span>
                <span>התחברות באמצעות קישור קסם</span>
              </button>
            </form>
          ) : (
            // Étape code : on garde la logique existante mais dans un style proche Stitch
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-right" style={{ color: '#403728' }}>
                  קוד אימות
                </h2>
                <p className="text-sm text-right text-slate-500">
                  שלחנו קוד SMS למספר{' '}
                  <span className="font-semibold" dir="ltr">
                    +972 {phone.replace(/\D/g, '').replace(/^0/, '')}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-right" style={{ color: '#403728' }}>
                  קוד בן 6 ספרות
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  dir="ltr"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full rounded-2xl border-2 border-[#F7D4E2] bg-[#FFF7FB] px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-zinc-900 focus:border-[var(--brand)] focus:outline-none transition-colors"
                  placeholder="• • • • • •"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-right text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#91006A] hover:bg-[#91006A]/90 text-white font-bold h-14 shadow-lg shadow-[#91006A]/20 transition-all flex items-center justify-center gap-2 rounded-lg"
              >
                <span className="material-symbols-outlined">check_circle</span>
                <span>{loading ? '...מאמתת' : 'כניסה'}</span>
              </button>

              <button
                type="button"
                className="w-full text-center text-sm font-medium transition active:opacity-70 text-primary"
                onClick={() => { setStage('phone'); setCode(''); setError(null); }}
              >
                ← להחליף מספר טלפון
              </button>
            </form>
          )}
        </div>

        {/* Section aide en pied, comme Stitch */}
        <div className="p-8 mt-auto text-center">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            נתקלת בבעיה?{' '}
            <a
              className="font-bold hover:underline"
              href="/help"
              style={{ color: '#91006A' }}
            >
              צרי קשר עם התמיכה
            </a>
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
