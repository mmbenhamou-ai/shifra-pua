import { createSupabaseServerClient } from '@/lib/supabase-server';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook: 'מבשלת',
  driver: 'מחלקת',
  admin: 'אדמין',
};

const ROLE_TABS = [
  { key: 'all', label: 'הכל' },
  { key: 'beneficiary', label: 'יולדות' },
  { key: 'cook', label: 'מבשלות' },
  { key: 'driver', label: 'מחלקות' },
  { key: 'admin', label: 'אדמינים' },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role = 'all' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('users')
    .select('id, name, role, phone, address, neighborhood, has_car, approved, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (role !== 'all') {
    query = query.eq('role', role);
  }

  const { data: users, error } = await query;
  const list = users ?? [];

  return (
    <div className="space-y-5 pb-2" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>
          משתמשות
        </h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>
          {list.length} משתמשות פעילות
        </p>
      </header>

      {/* ── Filtres par rôle ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ROLE_TABS.map((tab) => {
          const active = role === tab.key;
          return (
            <a
              key={tab.key}
              href={`/admin/users?role=${tab.key}`}
              className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: active ? '#811453' : '#FBE4F0',
                color: active ? '#FFFFFF' : '#811453',
              }}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          שגיאה בטעינת הנתונים: {error.message}
        </p>
      )}

      {/* ── Liste ── */}
      <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
        {list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-right" style={{ color: '#7C365F' }}>
            לא נמצאו משתמשות בקטגוריה זו.
          </p>
        ) : (
          <ul className="divide-y divide-[#FBE4F0]">
            {list.map((u) => (
              <li key={u.id} className="px-4 py-4">
                <div className="flex w-full flex-col items-end gap-1 text-right">
                  {/* שם + תפקיד */}
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: '#FBE4F0', color: '#811453' }}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    <span className="text-base font-semibold" style={{ color: '#4A0731' }}>
                      {u.name}
                    </span>
                  </div>

                  {/* טלפון */}
                  {u.phone && (
                    <a
                      href={`tel:${u.phone}`}
                      className="text-sm"
                      style={{ color: '#811453' }}
                    >
                      {u.phone}
                    </a>
                  )}

                  {/* כתובת / שכונה */}
                  {(u.address || u.neighborhood) && (
                    <span className="text-xs" style={{ color: '#7C365F' }}>
                      {[u.address, u.neighborhood].filter(Boolean).join(' · ')}
                    </span>
                  )}

                  {/* יש רכב (מחלקת) */}
                  {u.role === 'driver' && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: u.has_car ? '#D1FAE5' : '#FEF3C7',
                        color: u.has_car ? '#065F46' : '#92400E',
                      }}
                    >
                      {u.has_car ? 'יש רכב' : 'אין רכב'}
                    </span>
                  )}

                  {/* תאריך הצטרפות */}
                  <span className="text-xs" style={{ color: '#7C365F' }}>
                    הצטרפה {new Date(u.created_at).toLocaleDateString('he-IL')}
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
