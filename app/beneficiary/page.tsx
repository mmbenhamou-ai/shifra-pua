import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import MealCard from './MealCard';
import MealCountdown from './MealCountdown';
import Link from 'next/link';

export default async function BeneficiaryDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: beneficiary } = await supabase
    .from('beneficiaries')
    .select('id, end_date')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', session.user.id)
    .maybeSingle();

  const mealsRaw = beneficiary
    ? (await supabase
        .from('meals')
        .select('id, date, type, status, cook:cook_id(name), driver:driver_id(name)')
        .eq('beneficiary_id', beneficiary.id)
        .order('date', { ascending: true })
      ).data ?? []
    : [];

  const today = new Date().toISOString().split('T')[0];

  const meals = mealsRaw.map((m) => ({
    id:     m.id as string,
    date:   m.date as string,
    type:   m.type as string,
    status: m.status as string,
    cook:   (m.cook as { name?: string } | null)?.name ?? null,
    driver: (m.driver as { name?: string } | null)?.name ?? null,
  }));

  const todayMeals    = meals.filter((m) => m.date === today);
  const futureMeals   = meals.filter((m) => m.date > today).slice(0, 10);
  const pastMeals     = meals.filter((m) => m.date < today);
  const total         = meals.length;
  const confirmed     = meals.filter((m) => m.status === 'confirmed').length;
  const endDate       = (beneficiary?.end_date as string | null) ?? null;
  const todayStr      = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName     = (profile?.name as string | null)?.split(' ')[0] ?? '';

  return (
    <div className="space-y-6 pb-10" dir="rtl">

      {/* ── כותרת ── */}
      <header className="space-y-0.5 pt-1">
        <div className="flex items-center justify-between">
          <Link href="/beneficiary/history"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
                style={{ color: '#811453' }}>
            היסטוריה →
          </Link>
          <div className="text-right">
            <h2 className="text-2xl font-extrabold" style={{ color: '#1A0A10' }}>
              שלום{firstName ? ` ${firstName}` : ''}! 👋
            </h2>
            <p className="text-sm text-zinc-400">{todayStr}</p>
          </div>
        </div>
      </header>

      {/* ── ספירה לאחור ── */}
      <MealCountdown endDate={endDate} />

      {/* ── ארוחה של היום (Featured card) ── */}
      {todayMeals.length > 0 ? (
        <section className="space-y-2">
          {todayMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} featured />
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-8 text-center shadow-sm"
             style={{ boxShadow: '0 4px 20px rgba(129,20,83,0.08)' }}>
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
               style={{ backgroundColor: '#FBE4F0' }}>🍽️</div>
          <p className="text-base font-semibold" style={{ color: '#811453' }}>אין ארוחה מוזמנת להיום</p>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">הארוחות הבאות מוצגות למטה 👇</p>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'סה״כ',    value: total,                    color: '#811453' },
          { label: 'עתידיות', value: futureMeals.length,       color: '#D97706' },
          { label: 'אושרו',   value: confirmed,                color: '#059669' },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F7D4E2] bg-white p-3 text-right shadow-sm">
            <p className="text-[10px] font-medium text-zinc-400">{s.label}</p>
            <p className="text-2xl font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Prochaines ארוחות ── */}
      {futureMeals.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-right" style={{ color: '#811453' }}>ארוחות הבאות</h3>
          <ul className="space-y-2">
            {futureMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </ul>
        </section>
      )}

      {/* ── Empty state total ── */}
      {meals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#F7D4E2] bg-white py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
               style={{ backgroundColor: '#FBE4F0' }}>🍽️</div>
          <p className="text-base font-semibold" style={{ color: '#811453' }}>עדיין אין ארוחות מתוכננות</p>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed px-6">
            ברגע שהאדמין יאשר את הרשמתך,<br />הארוחות יופיעו כאן אוטומטית 💛
          </p>
        </div>
      )}

      {/* ── Link to full history ── */}
      {pastMeals.length > 0 && (
        <Link href="/beneficiary/history"
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#F7D4E2] bg-white py-3.5 text-sm font-semibold"
              style={{ color: '#811453' }}>
          <span>צפייה בהיסטוריה המלאה ({pastMeals.length} ארוחות)</span>
          <span>→</span>
        </Link>
      )}
    </div>
  );
}
