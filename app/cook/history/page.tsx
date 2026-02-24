import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function CookHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: meals } = await supabase
    .from('meals')
    .select('id, date, type, status, beneficiary:beneficiary_id(user:user_id(name, address))')
    .eq('cook_id', session.user.id)
    .order('date', { ascending: false });

  const list = meals ?? [];
  const delivered = list.filter((m) => ['delivered', 'confirmed'].includes(m.status as string));

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <div className="flex items-center justify-between">
        <Link href="/cook" className="text-sm font-medium" style={{ color: '#811453' }}>← חזרה</Link>
        <h1 className="text-xl font-bold" style={{ color: '#811453' }}>היסטוריית בישולים</h1>
      </div>

      {/* סיכום */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
          <p className="text-[10px] text-zinc-500">סה״כ ארוחות</p>
          <p className="text-3xl font-extrabold" style={{ color: '#811453' }}>{list.length}</p>
        </div>
        <div className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
          <p className="text-[10px] text-zinc-500">נמסרו</p>
          <p className="text-3xl font-extrabold" style={{ color: '#059669' }}>{delivered.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-3xl mb-2">🍲</p>
          <p className="text-sm text-zinc-500">עדיין לא הכנת ארוחות. מחכות לך! 💛</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const ben = (m.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
            return (
              <li key={m.id as string}
                  className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: ['delivered','confirmed'].includes(m.status as string) ? '#D1FAE5' : '#FEF3C7',
                          color:           ['delivered','confirmed'].includes(m.status as string) ? '#065F46' : '#92400E',
                        }}>
                    {['delivered','confirmed'].includes(m.status as string) ? 'נמסר ✓' : m.status}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {TYPE_LABELS[m.type as string] ?? m.type}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(m.date as string).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {ben && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        👶 {ben.name}{ben.address ? ` · ${ben.address}` : ''}
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
