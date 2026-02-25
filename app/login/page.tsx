'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Stage = 'phone' | 'code';
type Method = 'phone' | 'email';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return '+' + digits;
  if (digits.startsWith('0')) return '+972' + digits.slice(1);
  return '+972' + digits;
}

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('phone');
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError('נא למלא אימייל וסיסמה'); return; }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.session) { setError(signInError?.message || 'אימייל או סיסמה שגויים'); return; }
      const { data: profile } = await supabase.from('users').select('role, approved').eq('id', data.session.user.id).maybeSingle();
      if (!profile) { router.replace('/signup'); return; }
      if (!profile.approved) { router.replace('/signup/pending'); return; }
      const routes: Record<string, string> = { admin: '/admin', beneficiary: '/beneficiary', cook: '/cook', driver: '/driver' };
      router.replace(routes[profile.role as string] ?? '/');
    } catch { setError('אירעה שגיאה בלתי צפויה. נסי שוב.'); }
    finally { setLoading(false); }
  }

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
      className="min-h-screen flex flex-col items-center justify-center px-4"
      dir="rtl"
      style={{ background: 'linear-gradient(160deg, #FFF0F7 0%, #FBE4F0 50%, #F5C6DE 100%)' }}
    >
      {/* כרטיס */}
      <div className="w-full max-w-sm">
        {/* לוגו */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-bold text-white shadow-lg"
            style={{ backgroundColor: '#811453' }}
          >
            שפ
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#811453' }}>
              שפרה פועה
            </h1>
            <p className="text-sm" style={{ color: '#7C365F' }}>
              ארוחות חמות לאחר הלידה
            </p>
          </div>
        </div>

        {/* בחירת שיטת כניסה */}
        <div className="mb-4 flex rounded-2xl bg-white/60 p-1 shadow-sm">
          {([['phone', 'SMS 📱'], ['email', 'אימייל 📧']] as const).map(([m, label]) => (
            <button key={m} type="button"
              onClick={() => { setMethod(m); setError(null); setStage('phone'); }}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
              style={{
                backgroundColor: method === m ? '#811453' : 'transparent',
                color: method === m ? '#fff' : '#811453',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* טופס */}
        <div className="rounded-3xl bg-white px-6 py-7 shadow-xl shadow-[#811453]/10">

          {/* ── Email/Password ── */}
          {method === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-right" style={{ color: '#4A0731' }}>כניסה עם אימייל</h2>
                <p className="text-sm text-right" style={{ color: '#7C365F' }}>למשתמשים שנוצרו עם אימייל וסיסמה</p>
              </div>
              <div className="space-y-3">
                <input type="email" dir="ltr" placeholder="admin@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[#F7D4E2] bg-[#FFF7FB] px-4 py-3 text-sm text-left text-zinc-900 placeholder:text-gray-400 focus:border-[#811453] focus:outline-none transition-colors" />
                <input type="password" dir="ltr" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[#F7D4E2] bg-[#FFF7FB] px-4 py-3 text-sm text-left text-zinc-900 placeholder:text-gray-400 focus:border-[#811453] focus:outline-none transition-colors" />
              </div>
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-right text-red-700">{error}</p>}
              <button type="submit" disabled={loading}
                className="min-h-[52px] w-full rounded-2xl text-base font-bold text-white shadow-md shadow-[#811453]/30 transition active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: '#811453' }}>
                {loading ? '...נכנסת' : 'כניסה ←'}
              </button>
            </form>
          )}

          {method === 'phone' && (stage === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-right" style={{ color: '#4A0731' }}>
                  כניסה למערכת
                </h2>
                <p className="text-sm text-right" style={{ color: '#7C365F' }}>
                  הזיני את מספר הטלפון שלך לקבלת קוד SMS
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-right" style={{ color: '#4A0731' }}>
                  מספר טלפון
                </label>
                <div className="flex items-center overflow-hidden rounded-2xl border-2 border-[#F7D4E2] bg-[#FFF7FB] focus-within:border-[#811453] transition-colors">
                  <span
                    className="flex-shrink-0 px-3 py-3 text-sm font-semibold border-l border-[#F7D4E2]"
                    style={{ color: '#811453' }}
                  >
                    🇮🇱 +972
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-zinc-900 placeholder:text-gray-400 focus:outline-none"
                    placeholder="05X-XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
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
                className="min-h-[52px] w-full rounded-2xl text-base font-bold text-white shadow-md shadow-[#811453]/30 transition active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: '#811453' }}
              >
                {loading ? '...שולחת קוד' : 'שלחי לי קוד SMS ←'}
              </button>

              <p className="text-center text-xs" style={{ color: '#7C365F' }}>
                עדיין לא רשומה?{' '}
                <a href="/signup" className="font-semibold underline" style={{ color: '#811453' }}>
                  הרשמה כאן
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-right" style={{ color: '#4A0731' }}>
                  קוד אימות
                </h2>
                <p className="text-sm text-right" style={{ color: '#7C365F' }}>
                  שלחנו קוד SMS למספר{' '}
                  <span className="font-semibold" dir="ltr">
                    +972 {phone.replace(/\D/g, '').replace(/^0/, '')}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-right" style={{ color: '#4A0731' }}>
                  קוד בן 6 ספרות
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={6}
                  className="w-full rounded-2xl border-2 border-[#F7D4E2] bg-[#FFF7FB] px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-zinc-900 focus:border-[#811453] focus:outline-none transition-colors"
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
                className="min-h-[52px] w-full rounded-2xl text-base font-bold text-white shadow-md shadow-[#811453]/30 transition active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: '#811453' }}
              >
                {loading ? '...מאמתת' : 'כניסה ←'}
              </button>

              <button
                type="button"
                className="w-full text-center text-sm font-medium transition active:opacity-70"
                style={{ color: '#811453' }}
                onClick={() => { setStage('phone'); setCode(''); setError(null); }}
              >
                ← להחליף מספר טלפון
              </button>
            </form>
          ))}
        </div>

        {/* dev hint */}
        {process.env.NODE_ENV !== 'production' && (
          <p className="mt-4 text-center text-xs text-zinc-400">
            <a href="/test-login" className="underline">כניסת פיתוח</a>
          </p>
        )}

        {/* Demo links */}
        {process.env.NEXT_PUBLIC_DEMO_TOKEN && (
          <div className="mt-6 border-t border-[#F7D4E2] pt-4">
            <p className="mb-3 text-center text-xs font-medium" style={{ color: '#9B6A8A' }}>
              — גישת דמו לבדיקות —
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'beneficiary', label: '👶 יולדת' },
                { role: 'cook',        label: '🍲 מבשלת' },
                { role: 'driver',      label: '🚗 מחלקת' },
                { role: 'cook-driver', label: '💛 מתנדבת' },
                { role: 'admin',       label: '⚙️ אדמין'  },
              ].map((d) => (
                <a
                  key={d.role}
                  href={`/demo/${d.role}?token=${process.env.NEXT_PUBLIC_DEMO_TOKEN}`}
                  className="rounded-xl border border-[#F7D4E2] bg-white py-2 text-center text-xs font-medium text-zinc-700 transition hover:border-[#811453] hover:text-[#811453] active:scale-95"
                >
                  {d.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
