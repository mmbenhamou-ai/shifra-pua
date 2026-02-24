import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { TakeMealButton, MarkReadyButton } from './CookActions';

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
  const today  = new Date().toISOString().split('T')[0];

  const [{ data: myMeals }, { data: openMeals }] = await Promise.all([
    supabase
      .from('meals')
      .select(`id, date, type, status, pickup_time,
        menu:menu_id(name, items),
        beneficiary:beneficiary_id(user:user_id(name, address))`)
      .eq('cook_id', userId)
      .in('status', ['cook_assigned', 'ready'])
      .order('date', { ascending: true }),

    supabase
      .from('meals')
      .select(`id, date, type, pickup_time,
        menu:menu_id(name, items),
        beneficiary:beneficiary_id(user:user_id(name, address))`)
      .eq('status', 'open')
      .gte('date', today)
      .order('date', { ascending: true }),
  ]);

  const mine = myMeals ?? [];
  const open  = openMeals ?? [];

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      {/* כותרת */}
      <header className="space-y-0.5">
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#811453' }}>שלום! 🍲</h2>
        <p className="text-sm text-zinc-500">לוח המשימות שלך כמבשלת</p>
      </header>

      {/* כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'ארוחות שלי',   value: mine.length, color: '#811453' },
          { label: 'ארוחות פנויות', value: open.length, color: '#D97706' },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="text-3xl font-extrabold leading-tight mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* הארוחות שלי */}
      {mine.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-bold" style={{ color: '#811453' }}>הארוחות שלי 👩‍🍳</h3>
          <ul className="space-y-3">
            {mine.map((meal) => {
              const ben  = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
              const menu = meal.menu as { name?: string; items?: string[] } | null;
              const isReady = meal.status === 'ready';
              return (
                <li key={meal.id as string}
                    className="overflow-hidden rounded-2xl border-2 bg-white shadow-md shadow-[#811453]/8"
                    style={{ borderColor: '#811453' }}>
                  {/* פס צבע */}
                  <div className="h-1" style={{ backgroundColor: isReady ? '#10B981' : '#3B82F6' }} />
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: isReady ? '#D1FAE5' : '#DBEAFE',
                                     color:           isReady ? '#065F46' : '#1E40AF' }}>
                        {isReady ? 'מוכנה לאיסוף ✓' : 'לקחתי על עצמי'}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">
                          {TYPE_LABELS[meal.type as string] ?? meal.type}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {meal.pickup_time ? ` · איסוף ${meal.pickup_time}` : ''}
                        </p>
                      </div>
                    </div>

                    {ben && (
                      <p className="mt-2 text-right text-xs text-zinc-600">
                        עבור: <strong>{ben.name}</strong>
                        {ben.address ? <span className="text-zinc-400"> · {ben.address}</span> : ''}
                      </p>
                    )}

                    {menu?.items && menu.items.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#F7D4E2] bg-[#FFF7FB] text-right">
                        <div className="flex items-center justify-between border-b border-[#F7D4E2] px-3 py-1.5">
                          <span className="rounded-full bg-[#F7D4E2] px-2 py-0.5 text-xs" style={{ color: '#811453' }}>
                            {menu.items.length} מנות
                          </span>
                          <p className="text-xs font-bold" style={{ color: '#811453' }}>
                            🍽️ {menu.name}
                          </p>
                        </div>
                        <ul className="px-3 py-2 space-y-1">
                          {menu.items.map((item: string, i: number) => (
                            <li key={i} className="flex items-center justify-end gap-1.5 text-sm text-zinc-800">
                              <span>{item}</span>
                              <span className="text-zinc-400 text-xs">{i + 1}.</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!isReady && <MarkReadyButton mealId={meal.id as string} />}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ארוחות פנויות */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
            {open.length} פנויות
          </span>
          <h3 className="text-base font-bold" style={{ color: '#811453' }}>ארוחות פנויות לבישול</h3>
        </div>

        {open.length === 0 ? (
          <div className="rounded-3xl border border-[#F7D4E2] bg-white px-5 py-8 text-center shadow-sm">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-base font-semibold" style={{ color: '#811453' }}>
              כל הארוחות מכוסות!
            </p>
            <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
              אין ארוחות פנויות כרגע.<br />תודה על המסירות שלך! 💛
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {open.map((meal) => {
              const ben  = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
              const menu = meal.menu as { name?: string; items?: string[] } | null;
              return (
                <li key={meal.id as string}
                    className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm transition-all active:scale-[0.99]">
                  <div className="h-1 bg-amber-400" />
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                        פנויה
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">
                          {TYPE_LABELS[meal.type as string] ?? meal.type}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {meal.pickup_time ? ` · איסוף ${meal.pickup_time}` : ''}
                        </p>
                      </div>
                    </div>

                    {ben?.address && (
                      <p className="mt-2 text-right text-xs text-zinc-600">📍 {ben.address}</p>
                    )}

                    {menu?.name && (
                      <p className="mt-1 text-right text-xs font-medium" style={{ color: '#811453' }}>
                        תפריט: {menu.name}
                      </p>
                    )}

                    <TakeMealButton mealId={meal.id as string} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
