import { createSupabaseServerClient } from '@/lib/supabase-server';
import { approveUser, rejectUser } from '../actions/registrations';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook: 'מבשלת',
  driver: 'מחלקת',
  admin: 'אדמין',
};

const FILTER_TABS = [
  { key: 'all', label: 'הכל' },
  { key: 'pending', label: 'ממתינות' },
  { key: 'beneficiary', label: 'יולדות' },
  { key: 'cook', label: 'מבשלות' },
  { key: 'driver', label: 'מחלקות' },
];

type User = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  approved: boolean;
  created_at: string;
};

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = 'all' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('users')
    .select('id, name, role, phone, approved, created_at')
    .order('created_at', { ascending: false });

  if (filter === 'pending') {
    query = query.eq('approved', false);
  } else if (filter !== 'all') {
    query = query.eq('role', filter);
  }

  const { data: users, error } = await query;

  const list: User[] = users ?? [];

  return (
    <div className="space-y-5 pb-2" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>
          הרשמות
        </h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>
          {list.length} משתמשות נמצאו
        </p>
      </header>

      {/* ── Filtres ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <a
              key={tab.key}
              href={`/admin/registrations?filter=${tab.key}`}
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
            לא נמצאו הרשמות בקטגוריה זו.
          </p>
        ) : (
          <ul className="divide-y divide-[#FBE4F0]">
            {list.map((u) => (
              <li key={u.id} className="px-4 py-4">
                <div className="flex w-full flex-col items-end gap-1 text-right">

                  {/* שם + תפקיד + סטטוס */}
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: '#FBE4F0', color: '#811453' }}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: u.approved ? '#D1FAE5' : '#FFF3CD',
                          color: u.approved ? '#065F46' : '#92400E',
                        }}
                      >
                        {u.approved ? 'מאושרת' : 'ממתינה'}
                      </span>
                    </div>
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

                  {/* תאריך הרשמה */}
                  <span className="text-xs" style={{ color: '#7C365F' }}>
                    נרשמה בתאריך {new Date(u.created_at).toLocaleDateString('he-IL')}
                  </span>

                  {/* כפתורי פעולה — רק לממתינות */}
                  {!u.approved && (
                    <div className="mt-2 flex w-full justify-start gap-2">
                      <form action={approveUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="min-h-[44px] min-w-[80px] rounded-full text-sm font-semibold text-white transition active:opacity-80"
                          style={{ backgroundColor: '#811453' }}
                        >
                          אישור ✓
                        </button>
                      </form>
                      <form action={rejectUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="min-h-[44px] min-w-[80px] rounded-full border text-sm font-semibold transition active:opacity-80"
                          style={{
                            borderColor: '#F7D4E2',
                            color: '#811453',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
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
