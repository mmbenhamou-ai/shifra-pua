'use client';

import { useTransition } from 'react';
import { updateShabbatPreferences } from './actions';

interface Prefs {
  is_vegetarian: boolean;
  spicy_level: number;
  cooking_notes: string | null;
  shabbat_friday: boolean;
  shabbat_saturday: boolean;
  shabbat_kashrut: string;
}

export default function PreferencesForm({ initial }: { initial: Prefs }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateShabbatPreferences(fd);
      // On reste sur place, Next revalidera la page
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {/* Intro */}
      <section className="bg-white rounded-3xl shadow-[0_8px_24px_rgba(129,20,83,0.08)] border border-[#F7D4E2] px-5 py-4">
        <p className="text-sm font-medium text-zinc-700 leading-relaxed">
          התפריט לשבת הוא קבוע ומבושל באהבה. כאן תוכלי להגדיר את ההעדפות האישיות שלך
          (צמחוני, רמת חריפות, רגישויות וכשרות) כדי שנתאים את המנות עבורך.
        </p>
      </section>

      {/* Kashrut */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#91006A] text-lg">✓</span>
          <h2 className="text-lg font-bold" style={{ color: '#403728' }}>רמת כשרות (השגחה)</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            `בד"צ העדה החרדית`,
            'הרב לנדא',
            'מהדרין',
            'רגיל',
          ].map((label) => (
            <label
              key={label}
              className="relative flex cursor-pointer items-center justify-center border-2 rounded-lg p-3 text-sm font-bold transition-all"
              style={{
                borderColor: initial.shabbat_kashrut === label ? '#91006A' : '#F7D4E2',
                backgroundColor: initial.shabbat_kashrut === label ? '#FFF7FB' : '#FFFFFF',
              }}
            >
              <input
                type="radio"
                name="shabbat_kashrut"
                value={label}
                defaultChecked={initial.shabbat_kashrut === label}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* Main dish preference */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#91006A] text-lg">🍽️</span>
          <h2 className="text-lg font-bold" style={{ color: '#403728' }}>העדפת מנה עיקרית</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#91006A]/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                🍗
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-zinc-900">סטנדרטי (בשרי)</p>
                <p className="text-xs text-zinc-500">עוף או בקר לפי התפריט הקבוע</p>
              </div>
            </div>
            <input
              type="radio"
              name="is_vegetarian"
              value="false"
              defaultChecked={!initial.is_vegetarian}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#91006A]/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-emerald-600">
                🥗
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-zinc-900">צמחוני / טבעוני</p>
                <p className="text-xs text-zinc-500">תחליף חלבון צמחי עשיר</p>
              </div>
            </div>
            <input
              type="radio"
              name="is_vegetarian"
              value="true"
              defaultChecked={initial.is_vegetarian}
              className="h-4 w-4"
            />
          </label>
        </div>
      </section>

      {/* Spicy level */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#91006A] text-lg">🌶️</span>
          <h2 className="text-lg font-bold" style={{ color: '#403728' }}>רמת חריפות מועדפת</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { val: 0, label: 'לא חריף' },
            { val: 1, label: 'קצת פיקנטי' },
            { val: 2, label: 'חריף' },
          ].map((opt) => (
            <label
              key={opt.val}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer text-xs"
              style={{
                borderColor: initial.spicy_level === opt.val ? '#91006A' : '#E5E7EB',
                backgroundColor: initial.spicy_level === opt.val ? '#FFF7FB' : '#FFFFFF',
                color: initial.spicy_level === opt.val ? '#91006A' : '#4B5563',
              }}
            >
              <input
                type="radio"
                name="spicy_level"
                value={opt.val.toString()}
                defaultChecked={initial.spicy_level === opt.val}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {/* Allergies / notes */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#91006A] text-lg">⚠️</span>
          <h2 className="text-lg font-bold" style={{ color: '#403728' }}>אלרגיות ורגישויות</h2>
        </div>
        <textarea
          name="cooking_notes"
          rows={3}
          defaultValue={initial.cooking_notes ?? ''}
          className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-right text-zinc-900 placeholder:text-gray-400 focus:border-[#91006A] focus:outline-none focus:ring-1 focus:ring-[#91006A]"
          placeholder="פרטי כאן אם יש אלרגיות (גלוטן, אגוזים, לקטוז...) או כל בקשה מיוחדת."
        />
      </section>

      {/* Shabbat days */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#91006A] text-lg">🕯️</span>
          <h2 className="text-lg font-bold" style={{ color: '#403728' }}>סעודות שבת שתרצי לקבל</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between px-4 py-3 rounded-xl border bg-white cursor-pointer"
                 style={{
                   borderColor: initial.shabbat_friday ? '#91006A' : '#E5E7EB',
                   backgroundColor: initial.shabbat_friday ? '#FFF7FB' : '#FFFFFF',
                 }}>
            <span className="text-sm font-semibold text-zinc-800">שבת ליל</span>
            <input
              type="checkbox"
              name="shabbat_friday"
              value="true"
              defaultChecked={initial.shabbat_friday}
              className="h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between px-4 py-3 rounded-xl border bg-white cursor-pointer"
                 style={{
                   borderColor: initial.shabbat_saturday ? '#91006A' : '#E5E7EB',
                   backgroundColor: initial.shabbat_saturday ? '#FFF7FB' : '#FFFFFF',
                 }}>
            <span className="text-sm font-semibold text-zinc-800">שבת צהריים</span>
            <input
              type="checkbox"
              name="shabbat_saturday"
              value="true"
              defaultChecked={initial.shabbat_saturday}
              className="h-4 w-4"
            />
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl text-base font-bold text-white py-3.5 shadow-lg transition active:scale-[0.97] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#91006A,#4A0731)', boxShadow: '0 8px 24px rgba(145,0,106,0.35)' }}
        >
          {isPending ? 'שומרת...' : 'שמור העדפות'}
        </button>
        <a
          href="/beneficiary"
          className="block text-center text-sm font-semibold"
          style={{ color: '#91006A' }}
        >
          חזרה ללוח הבקרה
        </a>
      </div>
    </form>
  );
}

