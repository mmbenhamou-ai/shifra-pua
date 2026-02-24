import { createSupabaseServerClient } from '@/lib/supabase-server';
import { RoleSelect, ToggleActiveButton } from './UserActions';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook:        'מבשלת',
  driver:      'מחלקת',
  admin:       'אדמין',
};

const ROLE_TABS = [
  { key: 'all',         label: 'הכל' },
  { key: 'beneficiary', label: 'יולדות' },
  { key: 'cook',        label: 'מבשלות' },
  { key: 'driver',      label: 'מחלקות' },
  { key: 'admin',       label: 'אדמינים' },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role = 'all', q = '' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('users')
    .select('id, name, role, phone, address, neighborhood, has_car, approved, created_at')
    .order('created_at', { ascending: false });

  if (role !== 'all') query = query.eq('role', role);
  if (q.trim())       query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data: users, error } = await query;
  const list = users ?? [];

  return (
    <div className="space-y-5 pb-2" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>משתמשות</h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>{list.length} נמצאו</p>
      </header>

      {/* Search */}
      <form method="GET" action="/admin/users" className="flex gap-2">
        {role !== 'all' && <input type="hidden" name="role" value={role} />}
        <input type="text" name="q" defaultValue={q}
               placeholder="חיפוש לפי שם או טלפון..."
               className="flex-1 rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-zinc-800 text-right focus:outline-none focus:ring-1 focus:ring-[#811453]" />
        <button type="submit" className="rounded-xl px-4 text-sm font-semibold text-white"
                style={{ backgroundColor: '#811453' }}>
          חפשי
        </button>
      </form>

      {/* Role tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ROLE_TABS.map((tab) => (
          <a key={tab.key}
             href={`/admin/users?role=${tab.key}${q ? `&q=${q}` : ''}`}
             className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
             style={{ backgroundColor: role === tab.key ? '#811453' : '#FBE4F0',
                      color:           role === tab.key ? '#FFFFFF' : '#811453' }}>
            {tab.label}
          </a>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}

      <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">לא נמצאו משתמשות.</p>
        ) : (
          <ul className="divide-y divide-[#FBE4F0]">
            {list.map((u) => (
              <li key={u.id as string} className="px-4 py-4">
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ToggleActiveButton userId={u.id as string} isActive={u.approved as boolean} />
                      <RoleSelect userId={u.id as string} current={u.role as string} />
                    </div>
                    <div className="text-right">
                      <span className={`flex items-center gap-1.5 text-base font-semibold ${!u.approved ? 'opacity-50' : ''}`}
                            style={{ color: '#4A0731' }}>
                        {!u.approved && <span className="text-xs text-zinc-400">(מושבת)</span>}
                        {u.name as string}
                      </span>
                    </div>
                  </div>

                  {u.phone && (
                    <a href={`tel:${u.phone}`} className="text-sm" style={{ color: '#811453' }}>
                      {u.phone as string}
                    </a>
                  )}

                  {(u.address || u.neighborhood) && (
                    <span className="text-xs text-zinc-400">
                      📍 {[u.address, u.neighborhood].filter(Boolean).join(' · ')}
                    </span>
                  )}

                  {u.role === 'driver' && (
                    <span className="rounded-full px-2 py-0.5 text-xs"
                          style={{ backgroundColor: u.has_car ? '#D1FAE5' : '#FEF3C7',
                                   color:           u.has_car ? '#065F46' : '#92400E' }}>
                      {u.has_car ? 'יש רכב' : 'אין רכב'}
                    </span>
                  )}

                  <span className="text-xs text-zinc-400">
                    הצטרפה {new Date(u.created_at as string).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
