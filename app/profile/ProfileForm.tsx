'use client';

import { useRef, useState, useTransition } from 'react';
import { updateProfile } from './actions';

interface User {
  name: string;
  phone: string;
  address: string | null;
  neighborhood: string | null;
  notes: string | null;
  email: string | null;
  role: string;
  notif_cooking: boolean;
  notif_delivery: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook: 'מבשלת',
  driver: 'מחלקת',
  admin: 'אדמין',
};

const inputWrapperClass = "relative flex items-center";
const inputClass = "form-input block w-full border-slate-200 bg-slate-50 h-14 pl-4 pr-12 transition-all text-right placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-[#91006A] focus:border-[#91006A]";
const iconClass = "absolute right-4 text-slate-400 flex items-center";

export default function ProfileForm({ user }: { user: User }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand)' }}>הפרופיל שלי</h1>
        <p className="text-sm text-zinc-500">
          תפקיד:{' '}
          <span className="font-semibold" style={{ color: 'var(--brand)' }}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </p>
      </header>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-medium pr-1">שם מלא *</label>
          <div className={inputWrapperClass}>
            <input
              name="name"
              required
              defaultValue={user.name}
              placeholder="שם פרטי ושם משפחה"
              className={inputClass}
            />
            <div className={iconClass}><span className="material-symbols-outlined">person</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-medium pr-1">מספר טלפון (לא ניתן לשינוי)</label>
          <div className={inputWrapperClass}>
            <input
              type="tel"
              readOnly
              dir="ltr"
              defaultValue={user.phone}
              className={inputClass + ' text-left bg-slate-100 text-slate-500 border-transparent'}
            />
            <div className={iconClass}><span className="material-symbols-outlined">phone_iphone</span></div>
          </div>
          <input type="hidden" name="phone" value={user.phone} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-medium pr-1">כתובת מגורים</label>
          <div className={inputWrapperClass}>
            <input
              name="address"
              defaultValue={user.address ?? ''}
              placeholder="רחוב, מספר, עיר"
              className={inputClass}
            />
            <div className={iconClass}><span className="material-symbols-outlined">location_on</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-medium pr-1">שכונה / אזור</label>
          <div className={inputWrapperClass}>
            <input
              name="neighborhood"
              defaultValue={user.neighborhood ?? ''}
              placeholder="שכונה"
              className={inputClass}
            />
            <div className={iconClass}><span className="material-symbols-outlined">map</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-medium pr-1">הערות / אלרגיות / העדפות</label>
          <div className={inputWrapperClass}>
            <textarea
              name="notes"
              defaultValue={user.notes ?? ''}
              placeholder="פרטים נוספים למבשלות ולמחלקות..."
              rows={3}
              className="block w-full border-slate-200 bg-slate-50 pl-4 pr-12 py-3 transition-all text-right placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-[#91006A] focus:border-[#91006A] resize-none"
            />
            <div className={`absolute top-3 right-4 text-slate-400 flex items-center`}>
              <span className="material-symbols-outlined">notes</span>
            </div>
          </div>
        </div>

        {/* התראות (Notification toggles via Stitch styled checkboxes) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <p className="text-sm font-bold uppercase tracking-wider text-[#91006A]/60 px-2">
            הגדרות התראות
          </p>

          <label className="flex items-center gap-4 bg-white p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 select-none">
            <div className="flex items-center justify-center rounded-full bg-[#91006A]/10 text-[#91006A] shrink-0 size-10">
              <span className="material-symbols-outlined">soup_kitchen</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-800">עדכונים על בישול</p>
              <p className="text-xs text-slate-500">קבלת התראות על ארוחות לבישול</p>
            </div>
            <div className="relative inline-flex items-center">
              <input type="checkbox" name="notif_cooking" value="true" defaultChecked={user.notif_cooking} className="peer sr-only" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#91006A] transition-colors"></div>
              <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:-translate-x-5"></div>
            </div>
          </label>

          <label className="flex items-center gap-4 bg-white p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 select-none">
            <div className="flex items-center justify-center rounded-full bg-[#91006A]/10 text-[#91006A] shrink-0 size-10">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-800">עדכונים על משלוחים</p>
              <p className="text-xs text-slate-500">קבלת התראות על נסיעות ומסירות</p>
            </div>
            <div className="relative inline-flex items-center">
              <input type="checkbox" name="notif_delivery" value="true" defaultChecked={user.notif_delivery} className="peer sr-only" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#91006A] transition-colors"></div>
              <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:-translate-x-5"></div>
            </div>
          </label>
        </div>

        {/* הודעות */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 border border-red-100 text-red-700">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-emerald-700 animate-[fadeIn_0.3s_ease-out]">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="text-sm font-medium">הפרטים נשמרו בהצלחה</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#91006A] hover:bg-[#91006A]/90 text-white font-bold h-14 shadow-lg shadow-[#91006A]/20 transition-all flex items-center justify-center gap-2 rounded-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-xl">{isPending ? 'sync' : 'save'}</span>
          <span>{isPending ? '...שומרת' : 'שמירת שינויים'}</span>
        </button>
      </form>
    </div>
  );
}
