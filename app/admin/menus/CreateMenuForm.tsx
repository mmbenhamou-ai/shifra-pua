'use client';

import { useRef, useState, useTransition } from 'react';
import { createMenu } from '../actions/menus';

export default function CreateMenuForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createMenu(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[#F7D4E2] bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold" style={{ color: '#811453' }}>
        + הוספת תפריט חדש
      </h2>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col items-end gap-1">
          <label className="text-sm font-medium" style={{ color: '#4A0731' }}>
            שם התפריט
          </label>
          <input
            name="name"
            required
            placeholder="למשל: ארוחת בוקר חמה"
            className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2 text-right text-sm text-zinc-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#811453]"
          />
        </div>

        <div className="flex flex-col items-end gap-1">
          <label className="text-sm font-medium" style={{ color: '#4A0731' }}>
            סוג ארוחה
          </label>
          <select
            name="type"
            required
            defaultValue=""
            className="w-full rounded-xl border border-[#F7D4E2] bg-white px-3 py-2 text-right text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#811453]"
          >
            <option value="" disabled>— בחרי סוג —</option>
            <option value="breakfast">ארוחת בוקר</option>
            <option value="shabbat_friday">ארוחת שבת (ליל)</option>
            <option value="shabbat_saturday">ארוחת שבת (צהריים)</option>
          </select>
        </div>

        <div className="flex flex-col items-end gap-1">
          <label className="text-sm font-medium" style={{ color: '#4A0731' }}>
            פריטים (שורה אחת לכל פריט)
          </label>
          <textarea
            name="items"
            required
            rows={4}
            placeholder={'לחם\nביצים\nגבינה\nסלט'}
            className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2 text-right text-sm text-zinc-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#811453]"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="min-h-[48px] w-full rounded-full text-sm font-semibold text-white transition active:opacity-80 disabled:opacity-60"
          style={{ backgroundColor: '#811453' }}
        >
          {isPending ? 'שומר...' : 'שמירה'}
        </button>
      </form>
    </section>
  );
}
