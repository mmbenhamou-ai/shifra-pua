import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import MealCard from './MealCard';

export default async function BeneficiaryDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: beneficiary } = await supabase
    .from('beneficiaries')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const mealsRaw = beneficiary
    ? (await supabase
        .from('meals')
        .select(`id, date, type, status, cook:cook_id(name), driver:driver_id(name)`)
        .eq('beneficiary_id', beneficiary.id)
        .order('date', { ascending: true })
      ).data ?? []
    : [];

  const meals = mealsRaw.map((m) => ({
    id:     m.id as string,
    date:   m.date as string,
    type:   m.type as string,
    status: m.status as string,
    cook:   (m.cook as { name?: string } | null)?.name ?? null,
    driver: (m.driver as { name?: string } | null)?.name ?? null,
  }));

  const total     = meals.length;
  const pending   = meals.filter((m) => m.status === 'delivered').length;
  const confirmed = meals.filter((m) => m.status === 'confirmed').length;
  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      {/* כותרת */}
      <header className="space-y-0.5">
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#811453' }}>
          שלום! 👋
        </h2>
        <p className="text-sm text-zinc-500">{today}</p>
      </header>

      {/* כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'סה״כ', value: total,     color: '#811453' },
          { label: 'ממתינות', value: pending, color: '#D97706' },
          { label: 'אושרו',  value: confirmed, color: '#059669' },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F7D4E2] bg-white p-3 text-right shadow-sm">
            <p className="text-[10px] font-medium text-zinc-500">{s.label}</p>
            <p className="text-2xl font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* אין ארוחות */}
      {meals.length === 0 && (
        <div className="rounded-3xl border border-[#F7D4E2] bg-white px-5 py-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-base font-semibold" style={{ color: '#811453' }}>
            עדיין אין ארוחות מתוכננות
          </p>
          <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
            ברגע שהאדמין יאשר את הרשמתך,<br />הארוחות יופיעו כאן אוטומטית. 💛
          </p>
        </div>
      )}

      {/* כל הארוחות */}
      {meals.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-bold" style={{ color: '#811453' }}>
            לוח הארוחות שלי
          </h3>
          <ul className="space-y-3">
            {meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
