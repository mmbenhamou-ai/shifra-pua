import { createSupabaseServerClient } from '@/lib/supabase-server';
import { approveUser, rejectUser } from '../actions/registrations';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook:        'מבשלת',
  driver:      'מחלקת',
  admin:       'אדמין',
};

const FILTER_TABS = [
  { key: 'all',         label: 'הכל' },
  { key: 'pending',     label: 'ממתינות' },
  { key: 'beneficiary', label: 'יולדות' },
  { key: 'cook',        label: 'מבשלות' },
  { key: 'driver',      label: 'מחלקות' },
];

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter = 'all', q = '' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('users')
    .select('id, name, role, phone, approved, created_at, address, neighborhood')
    .order('created_at', { ascending: false });

  if (filter === 'pending')        query = query.eq('approved', false);
  else if (filter !== 'all')       query = query.eq('role', filter);
  if (q.trim())                    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data: users, error } = await query;
  const list = users ?? [];

  return (
    <div className="space-y-5 pb-2" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>הרשמות</h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>{list.length} נמצאו</p>
      </header>

      {/* Search */}
      <form method="GET" action="/admin/registrations" className="flex gap-2">
        {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
        <input type="text" name="q" defaultValue={q}
               placeholder="חיפוש לפי שם או טלפון..."
               className="flex-1 rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-zinc-800 text-right focus:outline-none focus:ring-1 focus:ring-[#811453]" />
        <button type="submit"
                className="rounded-xl px-4 text-sm font-semibold text-white"
                style={{ backgroundColor: '#811453' }}>
          חפשי
        </button>
      </form>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <a key={tab.key}
             href={`/admin/registrations?filter=${tab.key}${q ? `&q=${q}` : ''}`}
             className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
             style={{ backgroundColor: filter === tab.key ? '#811453' : '#FBE4F0',
                      color:           filter === tab.key ? '#FFFFFF' : '#811453' }}>
            {tab.label}
          </a>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">
            {q ? `לא נמצאו תוצאות עבור "${q}"` : 'לא נמצאו הרשמות.'}
          </p>
        ) : (
          <ul className="divide-y divide-[#FBE4F0]">
            {list.map((u) => (
              <li key={u.id as string} className="px-4 py-4">
                <div className="flex w-full flex-col items-end gap-1.5 text-right">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: '#FBE4F0', color: '#811453' }}>
                        {ROLE_LABELS[u.role as string] ?? u.role}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-xs"
                            style={{ backgroundColor: u.approved ? '#D1FAE5' : '#FFF3CD',
                                     color:           u.approved ? '#065F46' : '#92400E' }}>
                        {u.approved ? 'מאושרת' : 'ממתינה'}
                      </span>
                    </div>
                    <span className="text-base font-semibold" style={{ color: '#4A0731' }}>{u.name as string}</span>
                  </div>

                  {u.phone && (
                    <a href={`tel:${u.phone}`} className="text-sm" style={{ color: '#811453' }}>
                      {u.phone as string}
                    </a>
                  )}

                  {(u.address || u.neighborhood) && (
                    <span className="text-xs text-zinc-500">
                      📍 {[u.neighborhood, u.address].filter(Boolean).join(' · ')}
                    </span>
                  )}

                  <span className="text-xs text-zinc-400">
                    {new Date(u.created_at as string).toLocaleDateString('he-IL')}
                  </span>

                  {!u.approved && (
                    <div className="mt-1 flex w-full justify-start gap-2">
                      <form action={approveUser.bind(null, u.id as string)}>
                        <button type="submit"
                                className="min-h-[44px] min-w-[80px] rounded-full text-sm font-semibold text-white transition active:opacity-80"
                                style={{ backgroundColor: '#811453' }}>
                          אישור ✓
                        </button>
                      </form>
                      <form action={rejectUser.bind(null, u.id as string)}>
                        <button type="submit"
                                className="min-h-[44px] min-w-[80px] rounded-full border text-sm font-semibold transition active:opacity-80"
                                style={{ borderColor: '#F7D4E2', color: '#811453' }}>
                          דחייה ✗
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
