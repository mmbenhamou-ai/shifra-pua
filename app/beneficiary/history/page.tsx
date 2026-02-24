import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const STATUS_META: Record<string, { label: string; color: string }> = {
  open:            { label: 'ממתינה למבשלת', color: '#92400E' },
  cook_assigned:   { label: 'מבשלת הוקצתה',  color: '#1E40AF' },
  ready:           { label: 'מוכנה לאיסוף',  color: '#065F46' },
  driver_assigned: { label: 'מחלקת הוקצתה',  color: '#5B21B6' },
  picked_up:       { label: 'נאסף',           color: '#9A3412' },
  delivered:       { label: 'נמסר',           color: '#3730A3' },
  confirmed:       { label: 'אושר ✓',         color: '#374151' },
};

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function BeneficiaryHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: beneficiary } = await supabase
    .from('beneficiaries')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const { data: meals } = beneficiary
    ? await supabase
        .from('meals')
        .select('id, date, type, status, cook:cook_id(name), driver:driver_id(name)')
        .eq('beneficiary_id', beneficiary.id)
        .order('date', { ascending: false })
    : { data: [] };

  const today = new Date().toISOString().split('T')[0];
  const past  = (meals ?? []).filter((m) => (m.date as string) < today);
  const upcoming = (meals ?? []).filter((m) => (m.date as string) >= today);

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <div className="flex items-center justify-between">
        <Link href="/beneficiary" className="text-sm font-medium" style={{ color: '#811453' }}>← חזרה</Link>
        <h1 className="text-xl font-bold" style={{ color: '#811453' }}>היסטוריית ארוחות</h1>
      </div>

      {/* סיכום */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'סה״כ',     value: (meals ?? []).length },
          { label: 'עתידיות', value: upcoming.length },
          { label: 'עברו',    value: past.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#F7D4E2] bg-white p-3 text-right shadow-sm">
            <p className="text-[10px] text-zinc-500">{s.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: '#811453' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {(meals ?? []).length === 0 ? (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm text-zinc-500">אין ארוחות בהיסטוריה עדיין</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {(meals ?? []).map((m) => {
            const st   = STATUS_META[m.status as string] ?? STATUS_META['open'];
            const cook = (m.cook as { name?: string } | null)?.name;
            const drv  = (m.driver as { name?: string } | null)?.name;
            const isPast = (m.date as string) < today;
            return (
              <li key={m.id as string}
                  className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm"
                  style={{ opacity: isPast ? 0.8 : 1 }}>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: st.color + '18', color: st.color }}>
                    {st.label}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {TYPE_LABELS[m.type as string] ?? m.type}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(m.date as string).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {(cook || drv) && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {cook ? `🍲 ${cook}` : ''}{cook && drv ? ' · ' : ''}{drv ? `🚗 ${drv}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
