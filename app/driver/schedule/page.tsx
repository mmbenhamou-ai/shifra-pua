import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

export default async function DriverSchedulePage() {
  const { session } = await getSessionOrDevBypass();
  if (!session) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const in14  = new Date(today); in14.setDate(in14.getDate() + 14);

  const { data: meals } = await supabase
    .from('meals')
    .select('id, date, type, status, cook:cook_id(name, address), beneficiary:beneficiary_id(user:user_id(name, address))')
    .eq('driver_id', session.user.id)
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', in14.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const list = meals ?? [];

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <div className="flex items-center justify-between">
        <Link href="/driver" className="text-sm font-medium" style={{ color: 'var(--brand)' }}>← חזרה</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--brand)' }}>לוח שבועי</h1>
      </div>
      <p className="text-xs text-zinc-500 text-right">המשלוחים שלך ב-14 הימים הקרובים</p>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-sm text-zinc-400">אין משלוחים מתוכננים בשבועיים הקרובים</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const cook = m.cook as { name?: string; address?: string } | null;
            const ben  = (m.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
            return (
              <li key={m.id as string}
                  className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
                <div className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: '#EDE9FE', color: '#5B21B6' }}>
                      {m.status === 'picked_up' ? 'נאסף' : 'לקחתי'}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">{TYPE_LABELS[m.type as string] ?? m.type}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(m.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  {cook?.name && <p className="text-xs text-zinc-500">🍲 {cook.name}</p>}
                  {ben?.name  && <p className="text-xs text-zinc-500">👶 {ben.name} · {ben.address}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
