import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function DriverHistoryPage() {
  const { session } = await getSessionOrDevBypass();
  if (!session) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: meals } = await supabase
    .from('meals')
    .select(`
      id, date, type, status,
      cook:cook_id(name, address),
      beneficiary:beneficiary_id(user:user_id(name, address))
    `)
    .eq('driver_id', session.user.id)
    .order('date', { ascending: false });

  const list      = meals ?? [];
  const delivered = list.filter((m) => ['delivered', 'confirmed'].includes(m.status as string));

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <div className="flex items-center justify-between">
        <Link href="/driver" className="text-sm font-medium" style={{ color: 'var(--brand)' }}>← חזרה</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--brand)' }}>היסטוריית חלוקות</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
          <p className="text-[10px] text-zinc-500">סה״כ משלוחים</p>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>{list.length}</p>
        </div>
        <div className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
          <p className="text-[10px] text-zinc-500">נמסרו בהצלחה</p>
          <p className="text-3xl font-extrabold" style={{ color: '#059669' }}>{delivered.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-3xl mb-2">🚗</p>
          <p className="text-sm text-zinc-500">עדיין לא חילקת ארוחות. מחכות לך! 💛</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const cook = (m.cook as { name?: string; address?: string } | null);
            const ben  = (m.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
            return (
              <li key={m.id as string}
                  className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
                <div className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: ['delivered','confirmed'].includes(m.status as string) ? '#D1FAE5' : '#FEF3C7',
                            color:           ['delivered','confirmed'].includes(m.status as string) ? '#065F46' : '#92400E',
                          }}>
                      {['delivered','confirmed'].includes(m.status as string) ? 'נמסר ✓' : 'בתהליך'}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">
                        {TYPE_LABELS[m.type as string] ?? m.type}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(m.date as string).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {cook?.name && <p className="text-xs text-zinc-500">🍲 {cook.name}{cook.address ? ` · ${cook.address}` : ''}</p>}
                  {ben?.name  && <p className="text-xs text-zinc-500">👶 {ben.name}{ben.address ? ` · ${ben.address}` : ''}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
