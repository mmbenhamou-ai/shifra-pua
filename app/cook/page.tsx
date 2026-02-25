import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { TakeMealButton, MarkReadyButton } from './CookActions';
import ReleaseButton from './ReleaseButton';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

const TYPE_COLORS: Record<string, { bg: string; accent: string }> = {
  breakfast:        { bg: '#FEF3C7', accent: '#D97706' },
  shabbat_friday:   { bg: '#EDE9FE', accent: '#7C3AED' },
  shabbat_saturday: { bg: '#DBEAFE', accent: '#2563EB' },
};

export default async function CookDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const today  = new Date().toISOString().split('T')[0];

  const [{ data: myMeals }, { data: openMeals }, { data: profile }, { count: totalCooked }] = await Promise.all([
    supabase
      .from('meals')
      .select('id, date, type, status, pickup_time, menu:menu_id(name, items), beneficiary:beneficiary_id(user:user_id(name, address, neighborhood, notes))')
      .eq('cook_id', userId)
      .in('status', ['cook_assigned', 'ready'])
      .order('date', { ascending: true }),

    supabase
      .from('meals')
      .select('id, date, type, pickup_time, menu:menu_id(name, items), beneficiary:beneficiary_id(user:user_id(name, address, neighborhood, notes))')
      .eq('status', 'open')
      .gte('date', today)
      .order('date', { ascending: true }),

    supabase.from('users').select('name, neighborhood').eq('id', userId).maybeSingle(),

    supabase.from('meals').select('*', { count: 'exact', head: true })
      .eq('cook_id', userId).in('status', ['delivered', 'confirmed']),
  ]);

  const mine = myMeals ?? [];
  const open = openMeals ?? [];
  const myNeighborhood = (profile?.neighborhood as string | null) ?? null;
  const firstName = (profile?.name as string | null)?.split(' ')[0] ?? '';

  function isSameNeighborhood(benNeighborhood?: string) {
    if (!myNeighborhood || !benNeighborhood) return false;
    return benNeighborhood.includes(myNeighborhood) || myNeighborhood.includes(benNeighborhood);
  }

  return (
    <div className="space-y-6 pb-24" dir="rtl">

      {/* ── Header ── */}
      <header className="pt-1">
        <div className="flex items-center justify-between">
          <Link href="/cook/history"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
                style={{ color: '#811453' }}>
            היסטוריה →
          </Link>
          <div className="text-right">
            <h2 className="text-2xl font-extrabold" style={{ color: '#1A0A10' }}>
              שלום{firstName ? ` ${firstName}` : ''}! 🍲
            </h2>
            <p className="text-sm text-zinc-400">
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'ארוחות שלי',   value: mine.length,    color: '#811453' },
          { label: 'פנויות',       value: open.length,    color: '#D97706' },
          { label: 'הכנתי סה״כ',   value: totalCooked ?? 0, color: '#059669' },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F0E8EC] bg-white p-3 text-right"
               style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p className="text-[10px] font-medium text-zinc-400">{s.label}</p>
            <p className="text-2xl font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── הארוחות שלי ── */}
      {mine.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-right" style={{ color: '#811453' }}>
            הארוחות שלי 👩‍🍳
          </h3>
          <div className="space-y-3">
            {mine.map((meal) => {
              const ben     = (meal.beneficiary as { user?: { name?: string; address?: string; neighborhood?: string; notes?: string } } | null)?.user;
              const menu    = meal.menu as { name?: string; items?: string[] } | null;
              const isReady = meal.status === 'ready';
              const tc      = TYPE_COLORS[meal.type as string] ?? TYPE_COLORS.breakfast;

              return (
                <div key={meal.id as string}
                     className="overflow-hidden rounded-3xl bg-white"
                     style={{ boxShadow: '0 4px 20px rgba(129,20,83,0.12)' }}>

                  {/* color header */}
                  <div className="px-5 pt-4 pb-3"
                       style={{ background: isReady ? 'linear-gradient(135deg,#059669,#10B981)' : 'linear-gradient(135deg,#811453,#4A0731)' }}>
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                        {isReady ? '✓ מוכן לאיסוף' : 'לקחתי על עצמי'}
                      </span>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">{TYPE_LABELS[meal.type as string] ?? meal.type}</p>
                        <p className="text-xs text-white/70">
                          {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                          {meal.pickup_time ? ` · איסוף ${meal.pickup_time}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    {/* Beneficiary info */}
                    {ben && (
                      <div className="flex items-center justify-between rounded-2xl bg-[#FFF7FB] px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                             style={{ backgroundColor: '#811453' }}>
                          {(ben.name ?? '?').charAt(0)}
                        </div>
                        <div className="flex-1 text-right mx-2">
                          <p className="text-sm font-bold text-zinc-900">👶 {ben.name}</p>
                          {ben.address && (
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(ben.address)}`}
                               target="_blank" rel="noopener noreferrer"
                               className="text-xs underline" style={{ color: '#811453' }}>
                              📍 {ben.address}
                            </a>
                          )}
                          {ben.notes && (
                            <p className="mt-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                              ⚠️ {ben.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Menu */}
                    {menu?.items && menu.items.length > 0 && (
                      <div className="overflow-hidden rounded-2xl border border-[#F7D4E2]">
                        <div className="flex items-center justify-between bg-[#FBE4F0] px-4 py-2">
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold" style={{ color: '#811453' }}>
                            {menu.items.length} מנות
                          </span>
                          <p className="text-sm font-bold" style={{ color: '#811453' }}>🍽️ {menu.name}</p>
                        </div>
                        <ul className="divide-y divide-[#FBE4F0] bg-white">
                          {menu.items.map((item: string, i: number) => (
                            <li key={`${meal.id as string}-item-${i}`} className="flex items-center justify-between px-4 py-2.5">
                              <span className="text-xs text-zinc-400">{i + 1}</span>
                              <span className="text-sm text-zinc-800">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!isReady && (
                      <>
                        <MarkReadyButton mealId={meal.id as string} />
                        <ReleaseButton mealId={meal.id as string} />
                      </>
                    )}
                    {isReady && (
                      <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3">
                        <span className="text-sm font-semibold text-emerald-700">✓ מחכים למחלקת לאסוף</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ארוחות פנויות — Wolt restaurant cards ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: open.length > 0 ? '#FEF3C7' : '#F3F4F6',
                         color:           open.length > 0 ? '#92400E' : '#9CA3AF' }}>
            {open.length > 0 ? `${open.length} פנויות` : 'הכל מכוסה'}
          </span>
          <h3 className="text-sm font-bold" style={{ color: '#811453' }}>ארוחות פנויות לבישול</h3>
        </div>

        {open.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#F7D4E2] bg-white py-12 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#FBE4F0] text-3xl">✨</div>
            <p className="text-base font-semibold" style={{ color: '#811453' }}>כל הארוחות מכוסות!</p>
            <p className="mt-1 text-sm text-zinc-400">תודה על המסירות שלך 💛</p>
          </div>
        ) : (
          <div className="space-y-3">
            {open.map((meal) => {
              const ben     = (meal.beneficiary as { user?: { name?: string; address?: string; neighborhood?: string; notes?: string } } | null)?.user;
              const menu    = meal.menu as { name?: string; items?: string[] } | null;
              const tc      = TYPE_COLORS[meal.type as string] ?? TYPE_COLORS.breakfast;
              const nearby  = isSameNeighborhood(ben?.neighborhood);

              return (
                <div key={meal.id as string}
                     className="overflow-hidden rounded-2xl border bg-white transition-all active:scale-[0.99]"
                     style={{ borderColor: nearby ? '#811453' : '#F0E8EC',
                              borderWidth: nearby ? 2 : 1,
                              boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                  {/* Type tag strip */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      {nearby && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: '#811453', color: '#fff' }}>
                          קרוב אלייך 📍
                        </span>
                      )}
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: tc.bg, color: tc.accent }}>
                        {TYPE_LABELS[meal.type as string] ?? meal.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-900">
                        {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      {meal.pickup_time && (
                        <p className="text-xs text-zinc-400">⏰ איסוף {meal.pickup_time}</p>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-2">
                    {/* Location */}
                    {ben?.address && (
                      <div className="flex items-center justify-between">
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(ben.address)}`}
                           target="_blank" rel="noopener noreferrer"
                           className="text-xs underline" style={{ color: '#1A73E8' }}>מפות</a>
                        <p className="text-xs text-zinc-600">📍 {ben.address}{ben.neighborhood ? ` · ${ben.neighborhood}` : ''}</p>
                      </div>
                    )}

                    {/* Notes/Allergies */}
                    {ben?.notes && (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        ⚠️ הערות: {ben.notes}
                      </p>
                    )}

                    {/* Menu preview */}
                    {menu?.name && (
                      <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                        <span className="text-xs text-zinc-500">{menu.items?.length ?? 0} מנות</span>
                        <p className="text-xs font-semibold text-zinc-800">🍽️ {menu.name}</p>
                      </div>
                    )}

                    <TakeMealButton mealId={meal.id as string} />
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
