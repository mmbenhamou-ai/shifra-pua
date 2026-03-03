import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import MealCard from './MealCard';
import MealCountdown from './MealCountdown';
import Link from 'next/link';

export default async function BeneficiaryDashboard() {
  const { session } = await getSessionOrDevBypass();
  if (!session) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: beneficiary } = await supabase
    .from('beneficiaries')
    .select('id, end_date, is_vegetarian, spicy_level, cooking_notes, shabbat_friday, shabbat_saturday, shabbat_kashrut')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', session.user.id)
    .maybeSingle();

  // Message de bienvenue admin
  const { data: settingRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'welcome_message')
    .maybeSingle();
  const welcomeMessage = (settingRow?.value as string | null) ?? null;

  const mealsRaw = beneficiary
    ? (
        await supabase
          .from('meals')
          .select('id, date, type, status, cook:cook_id(name), driver:driver_id(name)')
          .eq('beneficiary_id', beneficiary.id)
          .order('date', { ascending: false })
          .limit(30)
      ).data ?? []
    : [];

  const today = new Date().toISOString().split('T')[0];

  const meals = mealsRaw
    .map((m) => ({
      id:     m.id as string,
      date:   m.date as string,
      type:   m.type as string,
      status: m.status as string,
      cook:   (m.cook as { name?: string } | null)?.name ?? null,
      driver: (m.driver as { name?: string } | null)?.name ?? null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayMeals    = meals.filter((m) => m.date === today);
  const futureMeals   = meals.filter((m) => m.date > today).slice(0, 10);
  const pastMeals     = meals.filter((m) => m.date < today);
  const total         = meals.length;
  const confirmed     = meals.filter((m) => m.status === 'confirmed').length;
  const endDate       = (beneficiary?.end_date as string | null) ?? null;
  const todayStr      = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName     = (profile?.name as string | null)?.split(' ')[0] ?? '';

  return (
    <div
      className="min-h-screen flex justify-center px-4 pb-10 pt-8"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <div className="w-full max-w-md space-y-6">

        {/* ── כותרת / כרטיס héros Stitch ── */}
        <section className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(129,20,83,0.12)] border border-[#F7D4E2] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-right">
              <p className="text-xs font-medium text-zinc-400">{todayStr}</p>
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--brand)' }}>
                שלום{firstName ? ` ${firstName}` : ''}! 💛
              </h2>
            </div>
              <Link
              href="/beneficiary/history"
              className="rounded-full bg-[#FFF7FB] px-3 py-1.5 text-[11px] font-semibold"
              style={{ color: 'var(--brand)' }}
            >
              היסטוריה →
            </Link>
          </div>
          {welcomeMessage && (
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              {welcomeMessage}
            </p>
          )}
        </section>

        {/* ── ספירה לאחור ── */}
        <MealCountdown endDate={endDate} />

        {/* ── העדפות שלי ── */}
        {beneficiary && (
          <section className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold" style={{ color: 'var(--brand)' }}>ההגדרות שלי</p>
              <Link
                href="/beneficiary/preferences"
                className="text-[11px] font-semibold active:opacity-70"
                style={{ color: 'var(--brand)' }}
              >
                עדכון העדפות
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {beneficiary.is_vegetarian && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>🥗 צמחוני</span>
              )}
              {typeof beneficiary.spicy_level === 'number' && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  {['לא חריף 😌', 'קצת חריף 🌶', 'חריף 🔥'][beneficiary.spicy_level as number]}
                </span>
              )}
              {beneficiary.shabbat_friday && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>🕯️ שבת ליל</span>
              )}
              {beneficiary.shabbat_saturday && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>☀️ שבת צהריים</span>
              )}
              {beneficiary.shabbat_kashrut && beneficiary.shabbat_kashrut !== 'רגיל' && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                  כשרות: {beneficiary.shabbat_kashrut as string}
                </span>
              )}
            </div>
            {beneficiary.cooking_notes && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 text-right">
                ⚠️ {beneficiary.cooking_notes as string}
              </p>
            )}
          </section>
        )}

        {/* ── ארוחה של היום (carte Stitch principale) ── */}
        {todayMeals.length > 0 ? (
          <section className="space-y-2">
            {todayMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} featured />
            ))}
          </section>
        ) : (
          <section className="flex flex-col items-center justify-center rounded-3xl bg-white py-8 text-center shadow-[0_8px_24px_rgba(129,20,83,0.10)]">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                 style={{ backgroundColor: '#FBE4F0' }}>🍽️</div>
            <p className="text-base font-semibold" style={{ color: 'var(--brand)' }}>אין ארוחה מוזמנת להיום</p>
            <p className="mt-1 text-sm text-zinc-400 leading-relaxed">הארוחות הבאות מוצגות למטה 👇</p>
          </section>
        )}

        {/* ── Statistiques synthétiques ── */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { label: 'סה״כ',    value: total,              color: 'var(--brand)' },
            { label: 'עתידיות', value: futureMeals.length, color: '#D97706' },
            { label: 'אושרו',   value: confirmed,          color: '#059669' },
          ].map((s) => (
            <div key={s.label}
                 className="rounded-2xl border border-[#F7D4E2] bg-white p-3 text-right shadow-sm">
              <p className="text-[10px] font-medium text-zinc-400">{s.label}</p>
              <p className="text-2xl font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </section>

        {/* ── Prochaines ארוחות ── */}
        {futureMeals.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-right" style={{ color: 'var(--brand)' }}>הארוחות הבאות</h3>
            <ul className="space-y-2">
              {futureMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
            </ul>
          </section>
        )}

        {/* ── État sans aucune ארוחות ── */}
        {meals.length === 0 && (
          <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#F7D4E2] bg-white py-12 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                 style={{ backgroundColor: '#FBE4F0' }}>🍽️</div>
            <p className="text-base font-semibold" style={{ color: 'var(--brand)' }}>עדיין אין ארוחות מתוכננות</p>
            <p className="mt-1 text-sm text-zinc-400 leading-relaxed px-6">
              ברגע שהאדמין יאשר את הרשמתך,<br />הארוחות יופיעו כאן אוטומטית 💛
            </p>
          </section>
        )}

        {/* ── Lien vers l’historique complet ── */}
        {pastMeals.length > 0 && (
          <Link href="/beneficiary/history"
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#F7D4E2] bg-white py-3.5 text-sm font-semibold"
                style={{ color: 'var(--brand)' }}>
            <span>צפייה בהיסטוריה המלאה ({pastMeals.length} ארוחות)</span>
            <span>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
