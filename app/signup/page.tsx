'use client';

import { useState } from 'react';
import { registerUser } from './actions';

type Role = 'beneficiary' | 'cook' | 'driver';

const ROLES: { key: Role; label: string; desc: string; emoji: string }[] = [
  {
    key: 'beneficiary',
    label: 'יולדת',
    desc: 'אני זקוקה לארוחות לאחר הלידה',
    emoji: '👶',
  },
  {
    key: 'cook',
    label: 'מבשלת',
    desc: 'אני רוצה לבשל ארוחות למשפחות',
    emoji: '🍲',
  },
  {
    key: 'driver',
    label: 'מחלקת',
    desc: 'אני רוצה לחלק ארוחות',
    emoji: '🚗',
  },
];

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await registerUser(formData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בלתי צפויה');
      setPending(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      {/* Header */}
      <header
        className="w-full px-4 py-3 shadow-md"
        style={{ backgroundColor: '#811453' }}
      >
        <h1 className="text-xl font-bold text-white text-right">
          שפרה פועה — הרשמה
        </h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        {/* Étape 1 : choix du rôle */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1 text-right">
              <h2 className="text-xl font-bold" style={{ color: '#811453' }}>
                מי את?
              </h2>
              <p className="text-sm text-zinc-600">
                בחרי את תפקידך במערכת
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className="flex items-center justify-between rounded-2xl border-2 p-4 text-right transition active:scale-[0.99]"
                  style={{
                    borderColor: role === r.key ? '#811453' : '#F7D4E2',
                    backgroundColor: role === r.key ? '#FFF7FB' : '#FFFFFF',
                  }}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-base font-semibold text-zinc-900">
                      {r.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {r.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!role}
              onClick={() => setStep(2)}
              className="mt-2 min-h-[52px] w-full rounded-full text-base font-semibold text-white transition disabled:opacity-40"
              style={{ backgroundColor: '#811453' }}
            >
              המשך ←
            </button>
          </div>
        )}

        {/* Étape 2 : formulaire de détails */}
        {step === 2 && role && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="role" value={role} />

            <div className="space-y-1 text-right">
              <h2 className="text-xl font-bold" style={{ color: '#811453' }}>
                פרטים אישיים
              </h2>
              <p className="text-sm text-zinc-600">
                נרשמת כ: <strong className="text-zinc-900">{ROLES.find((r) => r.key === role)?.label}</strong>
              </p>
            </div>

            {/* Champs communs */}
            <Field label="שם מלא *">
              <input
                name="name"
                required
                placeholder="שם פרטי ושם משפחה"
                className={inputClass}
              />
            </Field>

            <Field label="מספר טלפון *">
              <input
                name="phone"
                type="tel"
                required
                dir="ltr"
                placeholder="05X-XXXXXXX"
                className={inputClass}
              />
            </Field>

            {/* יולדת */}
            {role === 'beneficiary' && (
              <>
                <Field label="כתובת מגורים *">
                  <input
                    name="address"
                    required
                    placeholder="רחוב, מספר, עיר"
                    className={inputClass}
                  />
                </Field>
                <Field label="תאריך לידת התינוק/ת *">
                  <input
                    name="birth_date"
                    type="date"
                    required
                    dir="ltr"
                    className={inputClass}
                  />
                </Field>
                <Field label="תאריך התחלה (מתי להתחיל לשלוח ארוחות?) *">
                  <input
                    name="start_date"
                    type="date"
                    required
                    dir="ltr"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {/* מבשלת / מחלקת */}
            {(role === 'cook' || role === 'driver') && (
              <>
                <Field label="שכונה">
                  <input
                    name="neighborhood"
                    placeholder="שכונה / אזור"
                    className={inputClass}
                  />
                </Field>
                <Field label="כתובת">
                  <input
                    name="address"
                    placeholder="כתובת מגורים"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {/* מחלקת — יש רכב */}
            {role === 'driver' && (
              <div className="flex flex-col items-end gap-2 text-right">
                <label className="text-sm font-medium text-zinc-800">
                  האם יש לך רכב?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'true', label: 'כן, יש לי רכב' },
                    { value: 'false', label: 'לא' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-1.5 text-sm text-zinc-800"
                    >
                      <input
                        type="radio"
                        name="has_car"
                        value={opt.value}
                        defaultChecked={opt.value === 'false'}
                        className="accent-[#811453]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 text-right">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[52px] flex-1 rounded-full border text-sm font-semibold transition"
                style={{ borderColor: '#F7D4E2', color: '#811453', backgroundColor: '#FFFFFF' }}
              >
                ← חזרה
              </button>
              <button
                type="submit"
                disabled={pending}
                className="min-h-[52px] flex-[2] rounded-full text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: '#811453' }}
              >
                {pending ? 'שולחת...' : 'שליחת הבקשה'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#F7D4E2] bg-white px-3 py-3 text-right text-sm text-zinc-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#811453]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <label className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      {children}
    </div>
  );
}
