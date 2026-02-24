import { createAdminClient } from '@/lib/supabase-admin';

function adminClient() {
  return createAdminClient();
}

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role = 'all', q = '' } = await searchParams;
  const admin = adminClient();

  let query = admin
    .from('users')
    .select('id, name, role, phone, neighborhood, address, has_car, approved, created_at, notes')
    .in('role', ['cook', 'driver'])
    .eq('approved', true)
    .order('name');

  if (role !== 'all') query = query.eq('role', role);
  if (q.trim())       query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data: volunteers } = await query;
  const list = volunteers ?? [];

  // Stats: count meals per volunteer this month
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const { data: cookStats }   = await admin.from('meals').select('cook_id').not('cook_id','is',null).gte('date',start);
  const { data: driverStats } = await admin.from('meals').select('driver_id').not('driver_id','is',null).gte('date',start);

  const cookCount: Record<string,number>   = {};
  const driverCount: Record<string,number> = {};
  (cookStats   ?? []).forEach((m) => { const id = m.cook_id   as string; cookCount[id]   = (cookCount[id]   ?? 0) + 1; });
  (driverStats ?? []).forEach((m) => { const id = m.driver_id as string; driverCount[id] = (driverCount[id] ?? 0) + 1; });

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>מתנדבות</h1>
        <p className="text-sm text-zinc-500">{list.length} מתנדבות פעילות</p>
      </header>

      {/* Filters */}
      <form method="GET" action="/admin/volunteers" className="flex gap-2">
        <input type="text" name="q" defaultValue={q}
               placeholder="חיפוש לפי שם/טלפון"
               className="flex-1 rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-zinc-800 text-right focus:outline-none focus:ring-1 focus:ring-[#811453]" />
        <select name="role" defaultValue={role}
                className="rounded-xl border border-[#F7D4E2] bg-white px-3 py-2.5 text-sm text-zinc-800 focus:outline-none">
          <option value="all">הכל</option>
          <option value="cook">מבשלות</option>
          <option value="driver">מחלקות</option>
        </select>
        <button type="submit" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: '#811453' }}>חפשי</button>
      </form>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-sm text-zinc-400">לא נמצאו מתנדבות</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#FBE4F0] overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
          {list.map((v) => {
            const monthCount = v.role === 'cook'
              ? (cookCount[v.id as string] ?? 0)
              : (driverCount[v.id as string] ?? 0);
            return (
              <li key={v.id as string} className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-sm font-bold text-white"
                       style={{ backgroundColor: '#811453' }}>
                    {(v.name as string).charAt(0)}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: '#FBE4F0', color: '#811453' }}>
                        {v.role === 'cook' ? '🍲 מבשלת' : '🚗 מחלקת'}
                      </span>
                      <p className="text-sm font-bold text-zinc-900">{v.name as string}</p>
                    </div>
                    {v.phone && (
                      <a href={`tel:${v.phone}`} className="text-xs mt-0.5 block" style={{ color: '#811453' }}>
                        {v.phone as string}
                      </a>
                    )}
                    {(v.neighborhood || v.address) && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        📍 {[v.neighborhood, v.address].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {monthCount > 0 && (
                      <p className="text-xs font-semibold mt-1" style={{ color: '#059669' }}>
                        {monthCount} {v.role === 'cook' ? 'ארוחות' : 'משלוחים'} החודש
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
