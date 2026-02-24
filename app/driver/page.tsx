import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NavButtons from './NavButtons';
import { TakeDeliveryButton, PickedUpButton, DeliveredButton } from './DriverActions';
import ReleaseButton from './ReleaseButton';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

// שלבי המשלוח בסגנון Wolt
const DELIVERY_STEPS = [
  { key: 'driver_assigned', label: 'קיבלתי משלוח',  icon: '🚗' },
  { key: 'picked_up',       label: 'אספתי',          icon: '📦' },
  { key: 'delivered',       label: 'נמסר',           icon: '✅' },
];

function DeliveryProgress({ status }: { status: string }) {
  const stepIdx = DELIVERY_STEPS.findIndex((s) => s.key === status);
  const pct = stepIdx < 0 ? 0 : Math.round(((stepIdx + 1) / DELIVERY_STEPS.length) * 100);

  return (
    <div className="space-y-3">
      {/* progress bar */}
      <div className="relative h-1.5 rounded-full bg-zinc-100">
        <div
          className="absolute inset-y-0 right-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #811453, #F97316)' }}
        />
      </div>
      {/* steps */}
      <div className="flex items-start justify-between">
        {DELIVERY_STEPS.map((step, i) => {
          const done    = i <= stepIdx;
          const current = i === stepIdx;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-all duration-300"
                style={{
                  backgroundColor: done ? '#811453' : '#F3F4F6',
                  boxShadow: current ? '0 0 0 3px rgba(129,20,83,0.2)' : 'none',
                  transform: current ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {done ? (
                  <span className="text-white text-sm">{i < stepIdx ? '✓' : step.icon}</span>
                ) : (
                  <span className="text-zinc-400 text-sm">{step.icon}</span>
                )}
              </div>
              <span
                className="text-center text-[10px] font-semibold leading-tight"
                style={{ color: done ? '#811453' : '#9CA3AF' }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="space-y-6 pb-24" dir="rtl">

      {/* ── כותרת ── */}
      <header className="space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <Link href="/driver/history" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm" style={{ color: '#811453' }}>
            היסטוריה →
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-right" style={{ color: '#1A0A10' }}>
              המסירות שלי 🚗
            </h2>
            <p className="text-sm text-zinc-400 text-right">
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      {/* ── Active deliveries — style Wolt tracking ── */}
      {mine.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#811453' }}>{mine.length}</span>
            <h3 className="text-base font-bold" style={{ color: '#811453' }}>משלוחים פעילים</h3>
          </div>

          {mine.map((meal) => {
            const cook = meal.cook as { name?: string; address?: string } | null;
            const ben  = (meal.beneficiary as { user?: { name?: string; phone?: string; address?: string } } | null)?.user;
            const isPickedUp = meal.status === 'picked_up';

            return (
              <div key={meal.id as string}
                   className="overflow-hidden rounded-3xl bg-white shadow-xl"
                   style={{ boxShadow: '0 8px 32px rgba(129,20,83,0.12)' }}>

                {/* header strip */}
                <div className="px-5 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #811453 0%, #4A0731 100%)' }}>
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <div className="text-right">
                      <p className="text-base font-bold text-white">{TYPE_LABELS[meal.type as string] ?? meal.type}</p>
                      <p className="text-xs text-white/70">{isPickedUp ? 'בדרך ליולדת' : 'ממתין לאיסוף'}</p>
                    </div>
                  </div>
                </div>

                {/* progress tracker */}
                <div className="px-5 py-4 border-b border-zinc-100">
                  <DeliveryProgress status={meal.status as string} />
                </div>

                {/* addresses */}
                <div className="divide-y divide-zinc-100 px-5">
                  {cook && (
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2">
                        {cook.address && <NavButtons address={cook.address} label="נווט" compact />}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-zinc-800">🍲 {cook.name}</p>
                        {cook.address && <p className="text-xs text-zinc-400 mt-0.5">{cook.address}</p>}
                        {meal.pickup_time && <p className="text-xs text-zinc-400">⏰ {meal.pickup_time}</p>}
                      </div>
                    </div>
                  )}
                  {ben && (
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2">
                        {ben.address && <NavButtons address={ben.address} label="נווט" compact />}
                        {ben.phone && (
                          <a href={`tel:${ben.phone}`}
                             className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                             style={{ backgroundColor: '#FBE4F0' }}>📞</a>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-zinc-800">👶 {ben.name}</p>
                        {ben.address && <p className="text-xs text-zinc-400 mt-0.5">{ben.address}</p>}
                        {meal.delivery_time && <p className="text-xs text-zinc-400">⏰ {meal.delivery_time}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* action button */}
                <div className="px-5 pb-5 pt-3 space-y-2">
                  {!isPickedUp && (
                    <>
                      <PickedUpButton mealId={meal.id as string} />
                      <ReleaseButton mealId={meal.id as string} />
                    </>
                  )}
                  {isPickedUp  && <DeliveredButton mealId={meal.id as string} />}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Available deliveries ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: avail.length > 0 ? '#FEF3C7' : '#F3F4F6',
                         color: avail.length > 0 ? '#92400E' : '#9CA3AF' }}>
            {avail.length > 0 ? `${avail.length} פנויים` : 'הכל מכוסה'}
          </span>
          <h3 className="text-base font-bold" style={{ color: '#811453' }}>משלוחים זמינים</h3>
        </div>

        {avail.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#F7D4E2] bg-white py-12 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#FBE4F0] text-3xl">🎉</div>
            <p className="text-base font-semibold" style={{ color: '#811453' }}>כל המשלוחים מכוסים!</p>
            <p className="mt-1 text-sm text-zinc-400">תודה על המסירות שלך 💛</p>
          </div>
        ) : (
          <div className="space-y-3">
            {avail.map((meal) => {
              const cook = meal.cook as { name?: string; address?: string } | null;
              const ben  = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
              const isReady = meal.status === 'ready';

              return (
                <div key={meal.id as string}
                     className="overflow-hidden rounded-2xl border bg-white transition-all active:scale-[0.99]"
                     style={{ borderColor: '#F0E6EC', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                  {/* top bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: isReady ? '#D1FAE5' : '#FEF3C7',
                                   color:           isReady ? '#065F46' : '#B45309' }}>
                      {isReady ? '✓ מוכן לאיסוף' : 'ממתין'}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-900">{TYPE_LABELS[meal.type as string] ?? meal.type}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* route info */}
                  <div className="px-4 py-3 space-y-1.5">
                    {cook?.address && (
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#811453' }} />
                        <p className="text-xs text-zinc-600 flex-1 text-right">{cook.address} · {cook.name}</p>
                      </div>
                    )}
                    {cook?.address && ben?.address && (
                      <div className="mr-0.5 h-4 w-px" style={{ backgroundColor: '#F7D4E2', marginRight: '3px' }} />
                    )}
                    {ben?.address && (
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0 bg-zinc-300" />
                        <p className="text-xs text-zinc-600 flex-1 text-right">{ben.address} · {ben.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    <TakeDeliveryButton mealId={meal.id as string} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
