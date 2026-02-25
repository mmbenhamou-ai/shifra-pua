import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל שישי',
  shabbat_saturday: 'שבת צהריים',
};

async function createSlot(formData: FormData) {
  'use server';
  const admin = createAdminClient();
  await admin.from('time_slots').insert({
    label:         (formData.get('label') as string).trim(),
    meal_type:     formData.get('meal_type') as string,
    pickup_time:   formData.get('pickup_time') as string,
    delivery_time: formData.get('delivery_time') as string,
    max_per_slot:  parseInt(formData.get('max_per_slot') as string) || 5,
    active:        true,
  });
  revalidatePath('/admin/timeslots');
}

async function toggleSlot(id: string, active: boolean) {
  'use server';
  await createAdminClient().from('time_slots').update({ active: !active }).eq('id', id);
  revalidatePath('/admin/timeslots');
}

async function deleteSlot(id: string) {
  'use server';
  await createAdminClient().from('time_slots').delete().eq('id', id);
  revalidatePath('/admin/timeslots');
}

export default async function TimeSlotsPage() {
  const admin = createAdminClient();
  const { data: slots } = await admin
    .from('time_slots')
    .select('*')
    .order('meal_type')
    .order('pickup_time');

  const list = slots ?? [];

  const grouped = list.reduce<Record<string, typeof list>>((acc, s) => {
    const t = s.meal_type as string;
    if (!acc[t]) acc[t] = [];
    acc[t].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>חלונות זמן</h1>
        <p className="text-sm text-zinc-500 mt-0.5">הגדרת שעות איסוף ומסירה לכל סוג ארוחה</p>
      </header>

      {/* ── טופס יצירה ── */}
      <form action={createSlot} className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
        <div className="bg-[#FBE4F0] px-4 py-2.5">
          <p className="text-sm font-bold text-right" style={{ color: '#811453' }}>+ חלון זמן חדש</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="flex flex-col items-end gap-1">
            <label className="text-xs font-medium text-zinc-700">שם (לדוגמה: בוקר מוקדם)</label>
            <input name="label" required placeholder="בוקר מוקדם"
                   className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#811453]" />
          </div>

          <div className="flex flex-col items-end gap-1">
            <label className="text-xs font-medium text-zinc-700">סוג ארוחה</label>
            <select name="meal_type" required
                    className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#811453]">
              {Object.entries(MEAL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-end gap-1">
              <label className="text-xs font-medium text-zinc-700">שעת איסוף</label>
              <input name="pickup_time" type="time" required defaultValue="07:30" dir="ltr"
                     className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#811453]" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <label className="text-xs font-medium text-zinc-700">שעת מסירה</label>
              <input name="delivery_time" type="time" required defaultValue="08:30" dir="ltr"
                     className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#811453]" />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <label className="text-xs font-medium text-zinc-700">מקסימום הזמנות בחלון זה</label>
            <input name="max_per_slot" type="number" min="1" max="50" defaultValue="5" dir="ltr"
                   className="w-24 rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#811453]" />
          </div>

          <button type="submit"
                  className="w-full min-h-[48px] rounded-full text-sm font-semibold text-white transition active:opacity-90"
                  style={{ backgroundColor: '#811453' }}>
            הוספה +
          </button>
        </div>
      </form>

      {/* ── רשימה מקובצת לפי סוג ── */}
      {Object.entries(MEAL_TYPE_LABELS).map(([type, typeLabel]) => {
        const typeSlots = grouped[type] ?? [];
        return (
          <section key={type} className="space-y-2">
            <h2 className="text-sm font-bold text-right" style={{ color: '#811453' }}>{typeLabel}</h2>
            {typeSlots.length === 0 ? (
              <p className="text-xs text-zinc-400 text-right">אין חלונות זמן מוגדרים לסוג זה.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm divide-y divide-[#FBE4F0]">
                {typeSlots.map((s) => (
                  <div key={s.id as string} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <form action={toggleSlot.bind(null, s.id as string, s.active as boolean)}>
                        <button type="submit"
                                className="rounded-full px-2.5 py-0.5 text-xs font-semibold transition"
                                style={{ backgroundColor: s.active ? '#D1FAE5' : '#F3F4F6',
                                         color:           s.active ? '#065F46' : '#6B7280' }}>
                          {s.active ? 'פעיל' : 'כבוי'}
                        </button>
                      </form>
                      <form action={deleteSlot.bind(null, s.id as string)}>
                        <button type="submit" className="text-xs text-red-400 underline">מחק</button>
                      </form>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">{s.label as string}</p>
                      <p className="text-xs text-zinc-400" dir="ltr">
                        {s.pickup_time as string} → {s.delivery_time as string}
                        <span className="mr-2 text-zinc-300">|</span>
                        מקס׳ {s.max_per_slot as number}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
