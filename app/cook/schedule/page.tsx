import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function CookSchedulePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const today  = new Date();
  const in14   = new Date(today); in14.setDate(in14.getDate() + 14);

  const { data: meals } = await supabase
    .from('meals')
    .select('id, date, type, status, pickup_time, beneficiary:beneficiary_id(user:user_id(name, address))')
    .eq('cook_id', session.user.id)
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', in14.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const list = meals ?? [];

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <div className="flex items-center justify-between">
        <Link href="/cook" className="text-sm font-medium" style={{ color: '#811453' }}>← חזרה</Link>
        <h1 className="text-xl font-bold" style={{ color: '#811453' }}>לוח שבועי</h1>
      </div>
      <p className="text-xs text-zinc-500 text-right">הארוחות שלך ב-14 הימים הקרובים</p>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-sm text-zinc-400">אין ארוחות מתוכננות בשבועיים הקרובים</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const ben = (m.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
            return (
              <li key={m.id as string}
                  className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                      {m.status === 'ready' ? 'מוכן' : 'לקחתי'}
                    </span>
                    {m.pickup_time && <span className="text-xs text-zinc-400">⏰ {m.pickup_time}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {TYPE_LABELS[m.type as string] ?? m.type}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(m.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                    {ben && <p className="text-xs text-zinc-400">👶 {ben.name}</p>}
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
