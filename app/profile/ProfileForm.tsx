'use client';

import { useRef, useState, useTransition } from 'react';
import { updateProfile } from './actions';

interface User {
  name: string;
  phone: string;
  address: string | null;
  neighborhood: string | null;
  email: string | null;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת 👶',
  cook:        'מבשלת 🍲',
  driver:      'מחלקת 🚗',
  admin:       'אדמין',
};

const inputClass =
  'w-full rounded-2xl border-2 border-[#F7D4E2] bg-[#FFF7FB] px-4 py-3 text-right text-sm text-zinc-900 placeholder:text-gray-400 focus:border-[#811453] focus:outline-none transition-colors';

export default function ProfileForm({ user }: { user: User }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProfile(fd);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      }
    });
  }

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      {/* כותרת */}
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold" style={{ color: '#811453' }}>הפרופיל שלי</h1>
        <p className="text-sm text-zinc-500">
          תפקיד:{' '}
          <span className="font-semibold" style={{ color: '#811453' }}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </p>
      </header>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* שם */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-right" style={{ color: '#4A0731' }}>
            שם מלא *
          </label>
          <input
            name="name"
            required
            defaultValue={user.name}
            placeholder="שם פרטי ושם משפחה"
            className={inputClass}
          />
        </div>

        {/* טלפון */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-right" style={{ color: '#4A0731' }}>
            מספר טלפון *
          </label>
          <input
            name="phone"
            type="tel"
            required
            dir="ltr"
            defaultValue={user.phone}
            placeholder="05X-XXXXXXX"
            className={inputClass + ' text-left'}
          />
        </div>

        {/* כתובת */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-right" style={{ color: '#4A0731' }}>
            כתובת
          </label>
          <input
            name="address"
            defaultValue={user.address ?? ''}
            placeholder="רחוב, מספר, עיר"
            className={inputClass}
          />
        </div>

        {/* שכונה */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-right" style={{ color: '#4A0731' }}>
            שכונה / אזור
          </label>
          <input
            name="neighborhood"
            defaultValue={user.neighborhood ?? ''}
            placeholder="שכונה"
            className={inputClass}
          />
        </div>

        {/* אימייל */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-right" style={{ color: '#4A0731' }}>
            אימייל <span className="font-normal text-zinc-400">(אופציונלי)</span>
          </label>
          <input
            name="email"
            type="email"
            dir="ltr"
            defaultValue={user.email ?? ''}
            placeholder="example@gmail.com"
            className={inputClass + ' text-left'}
          />
          <p className="text-xs text-zinc-400 text-right">לקבלת עדכונים במייל</p>
        </div>

        {/* הודעות */}
        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-right text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-right text-green-700">
            ✓ הפרטים נשמרו בהצלחה!
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="min-h-[52px] w-full rounded-2xl text-base font-bold text-white shadow-md shadow-[#811453]/25 transition active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: '#811453' }}
        >
          {isPending ? '...שומרת' : 'שמירת פרטים ✓'}
        </button>
      </form>
    </div>
  );
}
