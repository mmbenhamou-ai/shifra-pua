import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { takeMeal, markMealReady } from '@/app/actions/meals';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function CookDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const today = new Date().toISOString().split('T')[0];

  // ארוחות שהמבשלת לקחה על עצמה
  const { data: myMeals } = await supabase
    .from('meals')
    .select(`
      id, date, type, status, pickup_time,
      menu:menu_id ( name, items ),
      beneficiary:beneficiary_id (
        user:user_id ( name, address )
      )
    `)
    .eq('cook_id', userId)
    .in('status', ['cook_assigned', 'ready'])
    .order('date', { ascending: true });

  // ארוחות פנויות (status=open) מהיום והלאה
  const { data: openMeals } = await supabase
    .from('meals')
    .select(`
      id, date, type, pickup_time,
      menu:menu_id ( name, items ),
      beneficiary:beneficiary_id (
        user:user_id ( name, address )
      )
    `)
    .eq('status', 'open')
    .gte('date', today)
    .order('date', { ascending: true });

  const mine = myMeals ?? [];
  const open = openMeals ?? [];

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold" style={{ color: '#811453' }}>שלום! 🍲</h2>
        <p className="text-sm text-zinc-600">לוח המשימות שלך כמבשלת</p>
      </header>

      {/* הארוחות שלי */}
      {mine.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold" style={{ color: '#811453' }}>
            הארוחות שלי 👩‍🍳
          </h3>
          <ul className="space-y-3">
            {mine.map((meal) => {
              const ben = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
              const menu = meal.menu as { name?: string; items?: string[] } | null;
              const isReady = meal.status === 'ready';
              return (
                <li
                  key={meal.id}
                  className="rounded-2xl border-2 bg-white px-4 py-4 shadow-sm"
                  style={{ borderColor: '#811453' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: isReady ? '#D1FAE5' : '#DBEAFE',
                        color: isReady ? '#065F46' : '#1E40AF',
                      }}
                    >
                      {isReady ? 'מוכנה לאיסוף ✓' : 'לקחתי על עצמי'}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">
                        {TYPE_LABELS[meal.type as string] ?? meal.type}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(meal.date as string).toLocaleDateString('he-IL', {
                          weekday: 'short', day: 'numeric', month: 'numeric',
                        })}
                        {meal.pickup_time ? ` · איסוף ${meal.pickup_time}` : ''}
                      </p>
                    </div>
                  </div>

                  {ben && (
                    <p className="mt-1 text-right text-xs text-zinc-600">
                      עבור: {ben.name}{ben.address ? ` · ${ben.address}` : ''}
                    </p>
                  )}

                  {menu?.items && menu.items.length > 0 && (
                    <div className="mt-2 rounded-xl bg-[#FFF7FB] px-3 py-2 text-right">
                      <p className="text-xs font-medium" style={{ color: '#811453' }}>
                        תפריט: {menu.name}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {menu.items.map((item: string, i: number) => (
                          <li key={i} className="text-xs text-zinc-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isReady && (
                    <form action={markMealReady.bind(null, meal.id as string)}>
                      <button
                        type="submit"
                        className="mt-3 min-h-[48px] w-full rounded-full text-sm font-semibold text-white transition active:opacity-80"
                        style={{ backgroundColor: '#811453' }}
                      >
                        מוכן לאיסוף ✓
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ארוחות פנויות */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
          >
            {open.length} פנויות
          </span>
          <h3 className="text-base font-semibold" style={{ color: '#811453' }}>
            ארוחות פנויות לבישול
          </h3>
        </div>

        {open.length === 0 ? (
          <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-6 text-center shadow-sm">
            <p className="text-sm text-zinc-500">אין ארוחות פנויות כרגע.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {open.map((meal) => {
              const ben = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
              const menu = meal.menu as { name?: string; items?: string[] } | null;
              return (
                <li
                  key={meal.id}
                  className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                    >
                      פנויה
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">
                        {TYPE_LABELS[meal.type as string] ?? meal.type}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(meal.date as string).toLocaleDateString('he-IL', {
                          weekday: 'short', day: 'numeric', month: 'numeric',
                        })}
                        {meal.pickup_time ? ` · איסוף ${meal.pickup_time}` : ''}
                      </p>
                    </div>
                  </div>

                  {ben?.address && (
                    <p className="mt-1 text-right text-xs text-zinc-600">📍 {ben.address}</p>
                  )}

                  {menu?.name && (
                    <p className="mt-1 text-right text-xs" style={{ color: '#811453' }}>
                      תפריט: {menu.name}
                    </p>
                  )}

                  <form action={takeMeal.bind(null, meal.id as string)}>
                    <button
                      type="submit"
                      className="mt-3 min-h-[48px] w-full rounded-full text-sm font-semibold text-white transition active:opacity-80"
                      style={{ backgroundColor: '#811453' }}
                    >
                      לקחתי על עצמי ✓
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
