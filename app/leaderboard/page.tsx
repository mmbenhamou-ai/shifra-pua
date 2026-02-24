import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export default async function LeaderboardPage() {
  const admin = adminClient();

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: cookMeals }  = await admin.from('meals').select('cook_id, cook:cook_id(name)').not('cook_id', 'is', null).gte('date', start).lte('date', end);
  const { data: driverMeals } = await admin.from('meals').select('driver_id, driver:driver_id(name)').not('driver_id', 'is', null).gte('date', start).lte('date', end);

  const cookMap: Record<string, { name: string; count: number }> = {};
  (cookMeals ?? []).forEach((m) => {
    const id   = m.cook_id as string;
    const name = (m.cook as { name?: string } | null)?.name ?? id;
    if (!cookMap[id]) cookMap[id] = { name, count: 0 };
    cookMap[id].count++;
  });

  const driverMap: Record<string, { name: string; count: number }> = {};
  (driverMeals ?? []).forEach((m) => {
    const id   = m.driver_id as string;
    const name = (m.driver as { name?: string } | null)?.name ?? id;
    if (!driverMap[id]) driverMap[id] = { name, count: 0 };
    driverMap[id].count++;
  });

  const topCooks   = Object.values(cookMap).sort((a, b) => b.count - a.count).slice(0, 10);
  const topDrivers = Object.values(driverMap).sort((a, b) => b.count - a.count).slice(0, 10);

  const monthName = now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen pb-10" dir="rtl"
         style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>
      <header className="w-full px-4 py-4 shadow-md" style={{ backgroundColor: '#811453' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="text-sm text-[#F7D4E2]">← חזרה</Link>
          <h1 className="text-xl font-bold text-white">לוח הכבוד 🏆</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 space-y-6">
        <p className="text-center text-sm font-semibold" style={{ color: '#811453' }}>{monthName}</p>

        {/* מבשלות */}
        <section className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#FBE4F0] bg-[#FBE4F0] px-5 py-3">
            <span className="text-xl">🍲</span>
            <h2 className="font-bold" style={{ color: '#811453' }}>מבשלות המובילות</h2>
          </div>
          {topCooks.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-zinc-400">אין נתונים עדיין</p>
          ) : (
            <ol className="divide-y divide-[#FBE4F0]">
              {topCooks.map((c, i) => (
                <li key={c.name} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="text-xl w-7 text-center">{medals[i] ?? `${i + 1}.`}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                       style={{ background: i === 0 ? 'linear-gradient(135deg,#F59E0B,#D97706)' : '#811453' }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#811453' }}>{c.count} ארוחות</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* מחלקות */}
        <section className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#FBE4F0] bg-[#FBE4F0] px-5 py-3">
            <span className="text-xl">🚗</span>
            <h2 className="font-bold" style={{ color: '#811453' }}>מחלקות המובילות</h2>
          </div>
          {topDrivers.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-zinc-400">אין נתונים עדיין</p>
          ) : (
            <ol className="divide-y divide-[#FBE4F0]">
              {topDrivers.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="text-xl w-7 text-center">{medals[i] ?? `${i + 1}.`}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                       style={{ background: i === 0 ? 'linear-gradient(135deg,#F59E0B,#D97706)' : '#811453' }}>
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-zinc-900">{d.name}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#811453' }}>{d.count} משלוחים</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
