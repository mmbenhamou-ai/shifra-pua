import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

function adminClient() {
  return createAdminClient();
}

async function saveSettings(formData: FormData) {
  'use server';
  const admin = adminClient();
  const settings = {
    default_breakfast_days:   parseInt(formData.get('default_breakfast_days') as string) || 14,
    default_shabbat_weeks:    parseInt(formData.get('default_shabbat_weeks') as string)  || 4,
    delivery_time_morning:    (formData.get('delivery_time_morning') as string) || '10:00',
    delivery_time_evening:    (formData.get('delivery_time_evening') as string) || '18:00',
    welcome_message:          (formData.get('welcome_message') as string) || '',
  };

  // Upsert each setting
  for (const [key, value] of Object.entries(settings)) {
    await admin.from('app_settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
  }
  revalidatePath('/admin/settings');
}

export default async function SettingsPage() {
  const admin = adminClient();
  const { data: rows } = await admin.from('app_settings').select('key, value');
  const s: Record<string, string> = {};
  (rows ?? []).forEach((r) => { s[r.key as string] = r.value as string; });

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>הגדרות מערכת</h1>
        <p className="text-sm text-zinc-500 mt-0.5">פרמטרים גלובליים לאפליקציה</p>
      </header>

      <form action={saveSettings} className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm divide-y divide-[#FBE4F0]">
          {/* ימי ארוחות */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-sm font-bold text-right" style={{ color: '#811453' }}>ארוחות ברירת מחדל</h2>
            <label className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-zinc-700">מספר ימי ארוחת בוקר</span>
              <input name="default_breakfast_days" type="number" min="1" max="90"
                     defaultValue={s.default_breakfast_days ?? '14'}
                     className="w-24 rounded-xl border border-[#F7D4E2] px-3 py-2 text-sm text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#811453]" />
            </label>
            <label className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-zinc-700">מספר שבועות ארוחות שבת</span>
              <input name="default_shabbat_weeks" type="number" min="1" max="12"
                     defaultValue={s.default_shabbat_weeks ?? '4'}
                     className="w-24 rounded-xl border border-[#F7D4E2] px-3 py-2 text-sm text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#811453]" />
            </label>
          </div>

          {/* שעות */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-sm font-bold text-right" style={{ color: '#811453' }}>שעות איסוף</h2>
            <label className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-zinc-700">שעת איסוף בוקר</span>
              <input name="delivery_time_morning" type="time"
                     defaultValue={s.delivery_time_morning ?? '10:00'}
                     className="rounded-xl border border-[#F7D4E2] px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#811453]" dir="ltr" />
            </label>
            <label className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-zinc-700">שעת איסוף ערב</span>
              <input name="delivery_time_evening" type="time"
                     defaultValue={s.delivery_time_evening ?? '18:00'}
                     className="rounded-xl border border-[#F7D4E2] px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#811453]" dir="ltr" />
            </label>
          </div>

          {/* הודעת ברכה */}
          <div className="px-4 py-4 space-y-2">
            <h2 className="text-sm font-bold text-right" style={{ color: '#811453' }}>הודעת ברכה</h2>
            <p className="text-xs text-zinc-500 text-right">תוצג ביולדות בדשבורד שלהן</p>
            <textarea name="welcome_message" rows={3}
                      defaultValue={s.welcome_message ?? 'ברוכה הבאה! אנחנו כאן בשבילך 💛'}
                      className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2 text-sm text-zinc-900 text-right focus:outline-none focus:ring-1 focus:ring-[#811453]" />
          </div>
        </div>

        <button type="submit"
                className="w-full min-h-[52px] rounded-full text-base font-semibold text-white transition active:opacity-90"
                style={{ backgroundColor: '#811453' }}>
          שמור הגדרות
        </button>
      </form>

      {/* SQL hint */}
      <details className="rounded-xl border border-[#F7D4E2] bg-white px-4 py-3">
        <summary className="cursor-pointer text-xs font-medium text-right" style={{ color: '#811453' }}>
          הוראות יצירת טבלת הגדרות ב-Supabase
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700 text-left" dir="ltr">{`CREATE TABLE app_settings (
  key  text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only"
  ON app_settings USING (false);`}</pre>
      </details>
    </div>
  );
}
