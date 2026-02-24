import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { takeDelivery, markPickedUp, markDelivered } from '@/app/actions/meals';
import NavButtons from './NavButtons';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function DriverDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const today = new Date().toISOString().split('T')[0];

  // משלוחים שהמחלקת לקחה
  const { data: myDeliveries } = await supabase
    .from('meals')
    .select(`
      id, date, type, status, pickup_time, delivery_time,
      cook:cook_id ( name, address ),
      beneficiary:beneficiary_id (
        user:user_id ( name, phone, address )
      )
    `)
    .eq('driver_id', userId)
    .in('status', ['driver_assigned', 'picked_up'])
    .order('date', { ascending: true });

  // משלוחים פנויים (status=ready) מהיום והלאה
  const { data: available } = await supabase
    .from('meals')
    .select(`
      id, date, type, status, pickup_time, delivery_time,
      cook:cook_id ( name, address ),
      beneficiary:beneficiary_id (
        user:user_id ( name, phone, address )
      )
    `)
    .in('status', ['cook_assigned', 'ready'])
    .gte('date', today)
    .order('date', { ascending: true });

  const mine = myDeliveries ?? [];
  const avail = available ?? [];

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold" style={{ color: '#811453' }}>שלום! 🚗</h2>
        <p className="text-sm text-zinc-600">לוח המסירות שלך</p>
      </header>

      {/* המסירות שלי */}
      {mine.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold" style={{ color: '#811453' }}>
            המסירות שלי 🚗
          </h3>
          <ul className="space-y-3">
            {mine.map((meal) => {
              const cook = meal.cook as { name?: string; address?: string } | null;
              const ben = (meal.beneficiary as { user?: { name?: string; phone?: string; address?: string } } | null)?.user;
              const isPickedUp = meal.status === 'picked_up';
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
                        backgroundColor: isPickedUp ? '#FED7AA' : '#EDE9FE',
                        color: isPickedUp ? '#9A3412' : '#5B21B6',
                      }}
                    >
                      {isPickedUp ? 'נאסף — בדרך למסירה 🚗' : 'לקחתי על עצמי'}
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

                  {/* כתובות */}
                  <div className="mt-3 space-y-1.5 rounded-xl bg-[#FFF7FB] px-3 py-2 text-right">
                    {cook && (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#811453' }}>
                          🍲 איסוף מהמבשלת
                        </p>
                        <p className="text-xs text-zinc-800">{cook.name}</p>
                        {cook.address && (
                          <p className="text-xs text-zinc-600">📍 {cook.address}</p>
                        )}
                        {meal.pickup_time && (
                          <p className="text-xs text-zinc-500">⏰ {meal.pickup_time}</p>
                        )}
                      </div>
                    )}
                    {ben && (
                      <div className="mt-1.5 border-t border-[#F7D4E2] pt-1.5">
                        <p className="text-xs font-semibold" style={{ color: '#811453' }}>
                          👶 מסירה ליולדת
                        </p>
                        <p className="text-xs text-zinc-800">{ben.name}</p>
                        {ben.address && (
                          <p className="text-xs text-zinc-600">📍 {ben.address}</p>
                        )}
                        {ben.phone && (
                          <a
                            href={`tel:${ben.phone}`}
                            className="text-xs"
                            style={{ color: '#811453' }}
                          >
                            📞 {ben.phone}
                          </a>
                        )}
                        {meal.delivery_time && (
                          <p className="text-xs text-zinc-500">⏰ {meal.delivery_time}</p>
                        )}
                        {ben.address && (
                          <NavButtons address={ben.address} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* כפתורי פעולה */}
                  <div className="mt-3 flex flex-col gap-2">
                    {!isPickedUp && (
                      <form action={markPickedUp.bind(null, meal.id as string)}>
                        <button
                          type="submit"
                          className="min-h-[48px] w-full rounded-full text-sm font-semibold text-white transition active:opacity-80"
                          style={{ backgroundColor: '#5B21B6' }}
                        >
                          נאסף ✓
                        </button>
                      </form>
                    )}
                    {isPickedUp && (
                      <form action={markDelivered.bind(null, meal.id as string)}>
                        <button
                          type="submit"
                          className="min-h-[48px] w-full rounded-full text-sm font-semibold text-white transition active:opacity-80"
                          style={{ backgroundColor: '#811453' }}
                        >
                          נמסר ✓
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* משלוחים פנויים */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
          >
            {avail.length} פנויים
          </span>
          <h3 className="text-base font-semibold" style={{ color: '#811453' }}>
            משלוחים פנויים
          </h3>
        </div>

        {avail.length === 0 ? (
          <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-6 text-center shadow-sm">
            <p className="text-sm text-zinc-500">אין משלוחים פנויים כרגע.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {avail.map((meal) => {
              const cook = meal.cook as { name?: string; address?: string } | null;
              const ben = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
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
                      {meal.status === 'ready' ? 'מוכן לאיסוף' : 'ממתין למחלקת'}
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

                  {/* כתובות בקצרה */}
                  <div className="mt-2 space-y-0.5 text-right text-xs text-zinc-600">
                    {cook?.address && <p>🍲 איסוף: {cook.address}</p>}
                    {ben?.address  && <p>👶 מסירה: {ben.address}</p>}
                  </div>

                  {ben?.address && (
                    <NavButtons address={ben.address} label="ניווט ליולדת" />
                  )}

                  <form action={takeDelivery.bind(null, meal.id as string)}>
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
