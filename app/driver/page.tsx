import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NavButtons from './NavButtons';
import { TakeDeliveryButton, PickedUpButton, DeliveredButton } from './DriverActions';

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
  const today  = new Date().toISOString().split('T')[0];

  const [{ data: myDeliveries }, { data: available }] = await Promise.all([
    supabase
      .from('meals')
      .select(`id, date, type, status, pickup_time, delivery_time,
        cook:cook_id(name, address),
        beneficiary:beneficiary_id(user:user_id(name, phone, address))`)
      .eq('driver_id', userId)
      .in('status', ['driver_assigned', 'picked_up'])
      .order('date', { ascending: true }),

    supabase
      .from('meals')
      .select(`id, date, type, status, pickup_time, delivery_time,
        cook:cook_id(name, address),
        beneficiary:beneficiary_id(user:user_id(name, phone, address))`)
      .in('status', ['cook_assigned', 'ready'])
      .gte('date', today)
      .order('date', { ascending: true }),
  ]);

  const mine  = myDeliveries ?? [];
  const avail = available ?? [];

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      {/* כותרת */}
      <header className="space-y-0.5">
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#811453' }}>שלום! 🚗</h2>
        <p className="text-sm text-zinc-500">לוח המסירות שלך</p>
      </header>

      {/* כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'המסירות שלי',    value: mine.length,  color: '#811453' },
          { label: 'משלוחים פנויים', value: avail.length, color: '#D97706' },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="text-3xl font-extrabold leading-tight mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* המסירות שלי */}
      {mine.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-bold" style={{ color: '#811453' }}>המסירות שלי 🚗</h3>
          <ul className="space-y-3">
            {mine.map((meal) => {
              const cook      = meal.cook as { name?: string; address?: string } | null;
              const ben       = (meal.beneficiary as { user?: { name?: string; phone?: string; address?: string } } | null)?.user;
              const isPickedUp = meal.status === 'picked_up';
              return (
                <li key={meal.id as string}
                    className="overflow-hidden rounded-2xl border-2 bg-white shadow-md shadow-[#811453]/8"
                    style={{ borderColor: '#811453' }}>
                  <div className="h-1" style={{ backgroundColor: isPickedUp ? '#F97316' : '#8B5CF6' }} />
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: isPickedUp ? '#FED7AA' : '#EDE9FE',
                                     color:           isPickedUp ? '#9A3412' : '#5B21B6' }}>
                        {isPickedUp ? 'נאסף — בדרך למסירה 🚗' : 'לקחתי על עצמי'}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">
                          {TYPE_LABELS[meal.type as string] ?? meal.type}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>

                    {/* כתובות */}
                    <div className="mt-3 space-y-2 rounded-xl bg-[#FFF7FB] px-3 py-3 text-right">
                      {cook && (
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#811453' }}>🍲 איסוף מהמבשלת</p>
                          <p className="text-xs text-zinc-800 mt-0.5">{cook.name}</p>
                          {cook.address && <p className="text-xs text-zinc-500">📍 {cook.address}</p>}
                          {meal.pickup_time && <p className="text-xs text-zinc-400">⏰ {meal.pickup_time}</p>}
                        </div>
                      )}
                      {ben && (
                        <div className="border-t border-[#F7D4E2] pt-2">
                          <p className="text-xs font-bold" style={{ color: '#811453' }}>👶 מסירה ליולדת</p>
                          <p className="text-xs text-zinc-800 mt-0.5">{ben.name}</p>
                          {ben.address && <p className="text-xs text-zinc-500">📍 {ben.address}</p>}
                          {ben.phone && (
                            <a href={`tel:${ben.phone}`}
                               className="mt-0.5 block text-xs font-semibold"
                               style={{ color: '#811453' }}>
                              📞 {ben.phone}
                            </a>
                          )}
                          {meal.delivery_time && <p className="text-xs text-zinc-400">⏰ {meal.delivery_time}</p>}
                          {ben.address && <NavButtons address={ben.address} />}
                        </div>
                      )}
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="mt-3 flex flex-col gap-2">
                      {!isPickedUp && <PickedUpButton  mealId={meal.id as string} />}
                      {isPickedUp  && <DeliveredButton mealId={meal.id as string} />}
                    </div>
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
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
            {avail.length} פנויים
          </span>
          <h3 className="text-base font-bold" style={{ color: '#811453' }}>משלוחים פנויים</h3>
        </div>

        {avail.length === 0 ? (
          <div className="rounded-3xl border border-[#F7D4E2] bg-white px-5 py-8 text-center shadow-sm">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-base font-semibold" style={{ color: '#811453' }}>
              כל המשלוחים מכוסים!
            </p>
            <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
              אין משלוחים פנויים כרגע.<br />תודה על המסירות שלך! 💛
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {avail.map((meal) => {
              const cook = meal.cook as { name?: string; address?: string } | null;
              const ben  = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
              return (
                <li key={meal.id as string}
                    className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm transition-all active:scale-[0.99]">
                  <div className="h-1 bg-amber-400" />
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: meal.status === 'ready' ? '#D1FAE5' : '#FEF3C7',
                                     color:           meal.status === 'ready' ? '#065F46' : '#92400E' }}>
                        {meal.status === 'ready' ? 'מוכן לאיסוף ✓' : 'ממתין למחלקת'}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">
                          {TYPE_LABELS[meal.type as string] ?? meal.type}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-0.5 text-right">
                      {cook?.address && <p className="text-xs text-zinc-600">🍲 איסוף: {cook.address}</p>}
                      {ben?.address  && <p className="text-xs text-zinc-600">👶 מסירה: {ben.address}</p>}
                    </div>

                    {ben?.address && <NavButtons address={ben.address} label="ניווט ליולדת" />}

                    <TakeDeliveryButton mealId={meal.id as string} />
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
