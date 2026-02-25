import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const now   = new Date();
  const { month = String(now.getMonth() + 1), year = String(now.getFullYear()) } = await searchParams;
  const m     = parseInt(month);
  const y     = parseInt(year);
  const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
  const end   = new Date(y, m, 0).toISOString().split('T')[0];

  const admin = createAdminClient();

  const [
    { count: totalMeals },
    { count: coveredMeals },
    { count: deliveredMeals },
    { count: confirmedMeals },
    { count: newUsers },
  ] = await Promise.all([
    admin.from('meals').select('*', { count: 'exact', head: true }).gte('date', start).lte('date', end),
    admin.from('meals').select('*', { count: 'exact', head: true }).gte('date', start).lte('date', end).neq('status', 'open'),
    admin.from('meals').select('*', { count: 'exact', head: true }).gte('date', start).lte('date', end).in('status', ['delivered', 'confirmed']),
    admin.from('meals').select('*', { count: 'exact', head: true }).gte('date', start).lte('date', end).eq('status', 'confirmed'),
    admin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', start + 'T00:00:00').lte('created_at', end + 'T23:59:59'),
  ]);

  const total     = totalMeals     ?? 0;
  const covered   = coveredMeals   ?? 0;
  const delivered = deliveredMeals ?? 0;
  const confirmed = confirmedMeals ?? 0;
  const coverage  = total > 0 ? Math.round((covered / total) * 100) : 0;

  const monthName = new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(y, i, 1).toLocaleDateString('he-IL', { month: 'long' }),
  }));

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>דוחות חודשיים</h1>
      </header>

      {/* Month selector */}
      <form method="GET" action="/admin/reports" className="flex gap-2">
        <select name="month" defaultValue={month}
                className="flex-1 rounded-xl border border-[#F7D4E2] bg-white px-3 py-2.5 text-sm focus:outline-none">
          {months.map((mo) => <option key={mo.value} value={mo.value}>{mo.label}</option>)}
        </select>
        <select name="year" defaultValue={year}
                className="rounded-xl border border-[#F7D4E2] bg-white px-3 py-2.5 text-sm focus:outline-none">
          {[2024, 2025, 2026].map((yr) => <option key={yr} value={yr}>{yr}</option>)}
        </select>
        <button type="submit" className="rounded-xl px-4 text-sm font-semibold text-white"
                style={{ backgroundColor: '#811453' }}>הצג</button>
      </form>

      <h2 className="text-lg font-bold text-right" style={{ color: '#811453' }}>{monthName}</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'סה״כ ארוחות',     value: total,     color: '#811453' },
          { label: 'מכוסות',           value: covered,   color: '#2563EB' },
          { label: 'נמסרו',            value: delivered, color: '#D97706' },
          { label: 'אושרו',            value: confirmed, color: '#059669' },
          { label: '% כיסוי',          value: coverage + '%', color: '#7C3AED' },
          { label: 'הרשמות חדשות',     value: newUsers ?? 0, color: '#EC4899' },
        ].map((s) => (
          <div key={s.label}
               className="rounded-2xl border border-[#F7D4E2] bg-white p-4 text-right shadow-sm">
            <p className="text-[10px] text-zinc-400">{s.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Coverage bar */}
      <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4">
        <p className="text-sm font-bold text-right mb-2" style={{ color: '#811453' }}>אחוז כיסוי</p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${coverage}%`, background: 'linear-gradient(90deg, #811453, #F97316)' }} />
        </div>
        <p className="text-xs text-zinc-400 mt-1 text-left">{coverage}%</p>
      </div>

      {/* Export hint */}
      <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right">
        <p className="text-sm font-semibold" style={{ color: '#811453' }}>ייצוא CSV</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          לייצוא CSV, השתמשי ב-Supabase Table Editor → Export to CSV.
        </p>
        <Link href="/admin/stats" className="mt-2 block text-xs underline" style={{ color: '#811453' }}>
          לסטטיסטיקה מפורטת →
        </Link>
      </div>
    </div>
  );
}
