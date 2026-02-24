import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { confirmMealReceived } from '@/app/actions/meals';

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:            { label: 'פנויה — אין מתנדבת עדיין', color: '#92400E', bg: '#FEF3C7' },
  cook_assigned:   { label: 'יש מבשלת',                 color: '#1E40AF', bg: '#DBEAFE' },
  ready:           { label: 'מוכנה — ממתינה לאיסוף',    color: '#065F46', bg: '#D1FAE5' },
  driver_assigned: { label: 'יש מחלקת',                 color: '#5B21B6', bg: '#EDE9FE' },
  picked_up:       { label: 'בדרך אלייך 🚗',             color: '#9A3412', bg: '#FED7AA' },
  delivered:       { label: 'נמסרה — ממתין לאישור',     color: '#065F46', bg: '#D1FAE5' },
  confirmed:       { label: 'התקבלה ✓',                  color: '#374151', bg: '#F3F4F6' },
};

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function BeneficiaryDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // מצא את הרשומה ב-beneficiaries של המשתמשת הנוכחית
  const { data: beneficiary } = await supabase
    .from('beneficiaries')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const meals = beneficiary
    ? (await supabase
        .from('meals')
        .select(`
          id, date, type, status, pickup_time, delivery_time,
          cook:cook_id ( name ),
          driver:driver_id ( name )
        `)
        .eq('beneficiary_id', beneficiary.id)
        .order('date', { ascending: true })
      ).data ?? []
    : [];

  const pending = meals.filter((m) => m.status !== 'confirmed').length;

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold" style={{ color: '#811453' }}>שלום! 👋</h2>
        <p className="text-sm text-zinc-600">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      {/* סטטוס מהיר */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#F7D4E2] bg-white p-3 text-right shadow-sm">
          <p className="text-xs text-zinc-500">סה"כ ארוחות</p>
          <p className="text-3xl font-extrabold" style={{ color: '#811453' }}>{meals.length}</p>
        </div>
        <div className="rounded-2xl border border-[#F7D4E2] bg-white p-3 text-right shadow-sm">
          <p className="text-xs text-zinc-500">ממתינות לאישור</p>
          <p className="text-3xl font-extrabold text-amber-600">{pending}</p>
        </div>
      </div>

      {/* אין ארוחות */}
      {meals.length === 0 && (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-6 text-center shadow-sm">
          <p className="text-sm text-zinc-500">אין ארוחות מתוזמנות עדיין.</p>
          <p className="text-xs text-zinc-400 mt-1">ארוחות יופיעו כאן לאחר אישור האדמין.</p>
        </div>
      )}

      {/* רשימת ארוחות */}
      {meals.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold" style={{ color: '#811453' }}>
            לוח הארוחות שלי
          </h3>
          <ul className="space-y-3">
            {meals.map((meal) => {
              const st = STATUS[meal.status] ?? { label: meal.status, color: '#374151', bg: '#F3F4F6' };
              const cook = (meal.cook as { name?: string } | null)?.name;
              const driver = (meal.driver as { name?: string } | null)?.name;
              return (
                <li key={meal.id} className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">
                        {TYPE_LABELS[meal.type as string] ?? meal.type}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(meal.date as string).toLocaleDateString('he-IL', {
                          weekday: 'short', day: 'numeric', month: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {(cook || driver) && (
                    <div className="mt-2 flex flex-col items-end gap-0.5 text-xs text-zinc-600">
                      {cook   && <span>🍲 מבשלת: {cook}</span>}
                      {driver && <span>🚗 מחלקת: {driver}</span>}
                    </div>
                  )}

                  {meal.status === 'delivered' && (
                    <form action={confirmMealReceived.bind(null, meal.id as string)}>
                      <button
                        type="submit"
                        className="mt-3 min-h-[48px] w-full rounded-full text-sm font-semibold text-white transition active:opacity-80"
                        style={{ backgroundColor: '#811453' }}
                      >
                        אישור קבלה ✓
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
