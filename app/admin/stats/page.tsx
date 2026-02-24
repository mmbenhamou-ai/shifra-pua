import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function weekLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - 7 * offset);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default async function StatsPage() {
  const admin = adminClient();
  const now   = new Date();

  // --- Totaux globaux ---
  const [
    { count: totalMeals   },
    { count: totalUsers   },
    { count: coveredMeals },
    { count: pendingReg   },
  ] = await Promise.all([
    admin.from('meals').select('*', { count: 'exact', head: true }),
    admin.from('users').select('*', { count: 'exact', head: true }).eq('approved', true),
    admin.from('meals').select('*', { count: 'exact', head: true }).neq('status', 'open'),
    admin.from('users').select('*', { count: 'exact', head: true }).eq('approved', false),
  ]);

  const total    = totalMeals   ?? 0;
  const covered  = coveredMeals ?? 0;
  const coverage = total > 0 ? Math.round((covered / total) * 100) : 0;

  // --- Repas par semaine (6 dernières semaines) ---
  const weeks: { label: string; count: number; covered: number }[] = [];
  for (let w = 5; w >= 0; w--) {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() - 7 * w);
    const end   = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];

    const [{ count: wTotal }, { count: wCov }] = await Promise.all([
      admin.from('meals').select('*', { count: 'exact', head: true })
        .gte('date', startStr).lte('date', endStr),
      admin.from('meals').select('*', { count: 'exact', head: true })
        .gte('date', startStr).lte('date', endStr).neq('status', 'open'),
    ]);
    weeks.push({ label: weekLabel(w), count: wTotal ?? 0, covered: wCov ?? 0 });
  }
  const maxCount = Math.max(...weeks.map((w) => w.count), 1);

  // --- Top volunteers (cooks) ---
  const { data: cookMeals } = await admin
    .from('meals')
    .select('cook_id, cook:cook_id(name)')
    .not('cook_id', 'is', null);

  const cookMap: Record<string, { name: string; count: number }> = {};
  (cookMeals ?? []).forEach((m) => {
    const cId   = m.cook_id as string;
    const cName = (m.cook as { name?: string } | null)?.name ?? cId;
    if (!cookMap[cId]) cookMap[cId] = { name: cName, count: 0 };
    cookMap[cId].count++;
  });
  const topCooks = Object.values(cookMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // --- Top drivers ---
  const { data: driverMeals } = await admin
    .from('meals')
    .select('driver_id, driver:driver_id(name)')
    .not('driver_id', 'is', null);

  const driverMap: Record<string, { name: string; count: number }> = {};
  (driverMeals ?? []).forEach((m) => {
    const dId   = m.driver_id as string;
    const dName = (m.driver as { name?: string } | null)?.name ?? dId;
    if (!driverMap[dId]) driverMap[dId] = { name: dName, count: 0 };
    driverMap[dId].count++;
  });
  const topDrivers = Object.values(driverMap).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>סטטיסטיקה</h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>נתונים כלליים על פעילות המערכת</p>
      </header>

      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'סה״כ ארוחות',      value: total.toLocaleString('he-IL') },
          { label: 'משתמשות מאושרות',  value: (totalUsers ?? 0).toLocaleString('he-IL') },
          { label: 'אחוז כיסוי',        value: coverage + '%' },
          { label: 'ממתינות לאישור',   value: (pendingReg ?? 0).toLocaleString('he-IL') },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm text-right">
            <p className="text-2xl font-bold" style={{ color: '#811453' }}>{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* גרף שבועי */}
      <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-right" style={{ color: '#811453' }}>ארוחות לפי שבוע (6 שבועות אחרונים)</h2>
        <div className="flex items-end justify-between gap-1.5" style={{ height: 100 }}>
          {weeks.map((w) => {
            const h = Math.round((w.count / maxCount) * 100);
            const hc = Math.round((w.covered / maxCount) * 100);
            return (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-0.5">
                <p className="text-[9px] text-zinc-500 mb-0.5">{w.count}</p>
                <div className="w-full relative flex flex-col justify-end" style={{ height: 72 }}>
                  {/* total bar */}
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-sm"
                    style={{ height: `${h}%`, backgroundColor: '#F7D4E2' }}
                  />
                  {/* covered bar */}
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-sm"
                    style={{ height: `${hc}%`, backgroundColor: '#811453' }}
                  />
                </div>
                <p className="text-[9px] text-zinc-500 mt-0.5">{w.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-end gap-3 text-[10px] text-zinc-500">
          <span><span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ backgroundColor: '#F7D4E2' }} /> סה״כ</span>
          <span><span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ backgroundColor: '#811453' }} /> מכוסות</span>
        </div>
      </div>

      {/* מדד כיסוי */}
      <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-right" style={{ color: '#811453' }}>אחוז כיסוי כולל</h2>
        <div className="h-4 w-full overflow-hidden rounded-full bg-[#FBE4F0]">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${coverage}%`, backgroundColor: '#811453' }} />
        </div>
        <p className="mt-1 text-left text-xs text-zinc-500">{coverage}% ({covered} מתוך {total})</p>
      </div>

      {/* דירוג מתנדבות */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* מבשלות */}
        <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-right" style={{ color: '#811453' }}>🍲 מבשלות מובילות</h2>
          {topCooks.length === 0 ? (
            <p className="text-xs text-zinc-400 text-right">אין נתונים עדיין</p>
          ) : (
            <ol className="space-y-2">
              {topCooks.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between text-sm">
                  <span className="font-bold" style={{ color: '#811453' }}>{c.count} ארוחות</span>
                  <span className="flex items-center gap-1.5 text-zinc-800">
                    <span className="text-zinc-400 text-xs">#{i + 1}</span>
                    {c.name}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* מחלקות */}
        <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-right" style={{ color: '#811453' }}>🚗 מחלקות מובילות</h2>
          {topDrivers.length === 0 ? (
            <p className="text-xs text-zinc-400 text-right">אין נתונים עדיין</p>
          ) : (
            <ol className="space-y-2">
              {topDrivers.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between text-sm">
                  <span className="font-bold" style={{ color: '#811453' }}>{d.count} משלוחים</span>
                  <span className="flex items-center gap-1.5 text-zinc-800">
                    <span className="text-zinc-400 text-xs">#{i + 1}</span>
                    {d.name}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
