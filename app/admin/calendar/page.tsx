import { createAdminClient } from '@/lib/supabase-admin';

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  open:            { label: 'פנויה',          dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  cook_assigned:   { label: 'יש מבשלת',       dot: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF' },
  ready:           { label: 'מוכנה לאיסוף',   dot: '#10B981', bg: '#D1FAE5', text: '#065F46' },
  driver_assigned: { label: 'יש מחלקת',       dot: '#8B5CF6', bg: '#EDE9FE', text: '#5B21B6' },
  picked_up:       { label: 'נאסף',           dot: '#F97316', bg: '#FED7AA', text: '#9A3412' },
  delivered:       { label: 'נמסר',           dot: '#6366F1', bg: '#E0E7FF', text: '#3730A3' },
  confirmed:       { label: 'אושר ✓',         dot: '#6B7280', bg: '#F3F4F6', text: '#374151' },
};

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'בוקר',
  shabbat_friday:   "שבת ע'",
  shabbat_saturday: "שבת צ'",
};

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];

function getWeekDates(offsetWeeks: number): Date[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toStr(d: Date) { return d.toISOString().split('T')[0]; }

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week = '0' } = await searchParams;
  const offset = parseInt(week, 10) || 0;
  const days = getWeekDates(offset);
  const from = toStr(days[0]);
  const to   = toStr(days[6]);

  const admin = createAdminClient();
  const { data: meals } = await admin
    .from('meals')
    .select(`
      id, date, type, status,
      cook:cook_id ( name ),
      driver:driver_id ( name ),
      beneficiary:beneficiary_id (
        user:user_id ( name )
      )
    `)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  // Groupe les repas par date
  const byDate: Record<string, typeof meals> = {};
  for (const m of meals ?? []) {
    const d = m.date as string;
    if (!byDate[d]) byDate[d] = [];
    byDate[d]!.push(m);
  }

  const prevWeek = offset - 1;
  const nextWeek = offset + 1;

  // Labels de la semaine
  const weekLabel = offset === 0
    ? 'השבוע'
    : offset === 1 ? 'השבוע הבא'
    : offset === -1 ? 'השבוע שעבר'
    : `${offset > 0 ? '+' : ''}${offset} שבועות`;

  return (
    <div className="space-y-4 pb-4" dir="rtl">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>לוח שנה</h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>
          {weekLabel} — {days[0].toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
          {' עד '}
          {days[6].toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* ניווט בין שבועות */}
      <div className="flex items-center justify-between gap-2">
        <a
          href={`/admin/calendar?week=${nextWeek}`}
          className="flex min-h-[40px] items-center gap-1 rounded-full border px-4 text-sm font-medium transition active:opacity-70"
          style={{ borderColor: '#F7D4E2', color: 'var(--brand)', backgroundColor: '#FFF7FB' }}
        >
          הבא ←
        </a>
        <a
          href="/admin/calendar"
          className="rounded-full px-3 py-1.5 text-xs font-medium transition active:opacity-70"
          style={{ backgroundColor: '#F7D4E2', color: 'var(--brand)' }}
        >
          היום
        </a>
        <a
          href={`/admin/calendar?week=${prevWeek}`}
          className="flex min-h-[40px] items-center gap-1 rounded-full border px-4 text-sm font-medium transition active:opacity-70"
          style={{ borderColor: '#F7D4E2', color: 'var(--brand)', backgroundColor: '#FFF7FB' }}
        >
          → קודם
        </a>
      </div>

      {/* לגנדה */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_META).map(([, meta]) => (
          <span
            key={meta.label}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: meta.bg, color: meta.text }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: meta.dot }}
            />
            {meta.label}
          </span>
        ))}
      </div>

      {/* ימי השבוע */}
      <div className="space-y-3">
        {days.map((day, idx) => {
          const dateStr = toStr(day);
          const dayMeals = byDate[dateStr] ?? [];
          const isToday = dateStr === toStr(new Date());
          return (
              <div
              key={dateStr}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: isToday ? 'var(--brand)' : '#F7D4E2', borderWidth: isToday ? 2 : 1 }}
            >
              {/* כותרת יום */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ backgroundColor: isToday ? 'var(--brand)' : '#FFF7FB' }}
              >
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: isToday ? '#FBE4F0' : '#F7D4E2',
                    color: 'var(--brand)',
                  }}
                >
                  {dayMeals.length} ארוחות
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: isToday ? '#FFFFFF' : '#4A0731' }}
                >
                  {DAY_NAMES[idx]}{' '}
                  {day.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                  {isToday && ' — היום'}
                </span>
              </div>

              {dayMeals.length === 0 ? (
                <p className="px-4 py-3 text-right text-xs" style={{ color: '#7C365F' }}>
                  אין ארוחות מתוכננות
                </p>
              ) : (
                <ul className="divide-y divide-[#FBE4F0]">
                  {dayMeals.map((meal) => {
                    const st = STATUS_META[meal.status as string] ?? STATUS_META['open'];
                    const cook = (meal.cook as { name?: string } | null)?.name;
                    const driver = (meal.driver as { name?: string } | null)?.name;
                    const benName = (meal.beneficiary as { user?: { name?: string } } | null)?.user?.name;
                    return (
                      <li key={meal.id as string} className="flex items-center gap-3 px-4 py-2.5">
                        {/* נקודת סטטוס */}
                        <span
                          className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: st.dot }}
                        />
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-xs"
                              style={{ backgroundColor: st.bg, color: st.text }}
                            >
                              {st.label}
                            </span>
                            <span className="text-sm font-medium text-zinc-800">
                              {TYPE_LABELS[meal.type as string] ?? meal.type}
                              {benName ? ` — ${benName}` : ''}
                            </span>
                          </div>
                          {(cook || driver) && (
                            <div className="mt-0.5 flex justify-end gap-2 text-xs text-zinc-500">
                              {cook   && <span>🍲 {cook}</span>}
                              {driver && <span>🚗 {driver}</span>}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
