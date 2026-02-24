import { createSupabaseServerClient } from '@/lib/supabase-server';
import { approveUser, rejectUser } from './actions/registrations';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook: 'מבשלת',
  driver: 'מחלקת',
  admin: 'אדמין',
};

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  const [
    { count: activeBeneficiaries },
    { count: mealsToday },
    { count: openMeals },
    { count: activeVolunteers },
    { data: pendingUsers },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'beneficiary')
      .eq('approved', true),

    supabase
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('date', today),

    supabase
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .eq('date', today),

    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('role', ['cook', 'driver'])
      .eq('approved', true),

    supabase
      .from('users')
      .select('id, name, role, phone, created_at')
      .eq('approved', false)
      .order('created_at', { ascending: false }),
  ]);

  const stats = [
    {
      label: 'יולדות פעילות',
      value: activeBeneficiaries ?? 0,
      gradient: 'from-[#811453] to-[#F7D4E2]',
    },
    {
      label: 'ארוחות היום',
      value: mealsToday ?? 0,
      gradient: 'from-[#F7D4E2] to-[#FBE4F0]',
    },
    {
      label: 'ארוחות בהמתנה למתנדבת',
      value: openMeals ?? 0,
      gradient: 'from-[#D7263D] to-[#F7B2C4]',
    },
    {
      label: 'מתנדבות פעילות',
      value: activeVolunteers ?? 0,
      gradient: 'from-[#811453] to-[#F7B2C4]',
    },
  ];

  const pending = pendingUsers ?? [];

  return (
    <div className="space-y-6 pb-2" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>
          דשבורד אדמין
        </h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>
          תמונת מצב כללית של המערכת להיום.
        </p>
      </header>

      {/* ── Stats 2×2 ── */}
      <section className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl bg-gradient-to-br ${item.gradient} p-[1px] shadow-sm`}
            style={{ minHeight: 72 }}
          >
            <div className="flex h-full w-full flex-col items-end justify-center rounded-2xl bg-white/95 px-4 py-3">
              <span className="text-xs leading-tight" style={{ color: '#811453' }}>
                {item.label}
              </span>
              <span
                className="mt-0.5 text-3xl font-extrabold leading-none"
                style={{ color: '#4A0731' }}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Inscriptions en attente ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: '#811453' }}>
            הרשמות ממתינות לאישור
          </h2>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: '#F7D4E2', color: '#811453' }}
          >
            {pending.length} ממתינות
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
          {pending.length === 0 ? (
            <p className="px-4 py-5 text-sm text-right" style={{ color: '#7C365F' }}>
              אין כרגע הרשמות ממתינות. יפה מאוד! 🎉
            </p>
          ) : (
            <ul className="divide-y divide-[#FBE4F0]">
              {pending.map((u) => (
                <li key={u.id} className="px-4 py-3">
                  <div className="flex w-full flex-col items-end gap-1 text-right">
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color: '#4A0731' }}>
                        {u.name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{ backgroundColor: '#FBE4F0', color: '#811453' }}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </div>

                    {u.phone && (
                      <span className="text-xs" style={{ color: '#7C365F' }}>
                        {u.phone}
                      </span>
                    )}

                    <span className="text-xs" style={{ color: '#7C365F' }}>
                      נרשמה בתאריך{' '}
                      {new Date(u.created_at).toLocaleDateString('he-IL')}
                    </span>

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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
