import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getNowInTimezone } from '@/lib/utils';
import AdminLiveDashboard from './AdminLiveDashboard';

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: tzRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'timezone')
    .maybeSingle();

  const timezone = (tzRow?.value as string | null) || 'Asia/Jerusalem';
  const now = getNowInTimezone(timezone);
  const today = now.toISOString().split('T')[0];

  const in7days = new Date(now);
  in7days.setDate(in7days.getDate() + 7);
  const next7 = in7days.toISOString().split('T')[0];

  const in24h = new Date(now);
  in24h.setHours(in24h.getHours() + 24);
  const next24hDate = in24h.toISOString().split('T')[0];

  const [
    { count: activeBeneficiaries },
    { count: mealsToday },
    { count: openMealsNext7 },
    { count: activeVolunteers },
    { data: pendingUsers },
    { data: urgentMeals },
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
      .gte('date', today)
      .lte('date', next7),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('role', ['cook', 'driver'])
      .eq('approved', true),
    supabase
      .from('users')
      .select('id, name, role, phone, email, created_at')
      .eq('approved', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('meals')
      .select('id, date, type, beneficiary:beneficiary_id(user:user_id(name))')
      .eq('status', 'open')
      .gte('date', today)
      .lte('date', next24hDate)
      .order('date', { ascending: true })
      .limit(20),
  ]);

  const initialStats = [
    {
      label: 'יולדות פעילות',
      value: activeBeneficiaries ?? 0,
      gradient: 'from-[var(--brand)] to-[#F7D4E2]',
    },
    {
      label: 'ארוחות היום',
      value: mealsToday ?? 0,
      gradient: 'from-[#F7D4E2] to-[#FBE4F0]',
    },
    {
      label: 'ארוחות פנויות (7 ימים)',
      value: openMealsNext7 ?? 0,
      gradient: 'from-[#D7263D] to-[#F7B2C4]',
    },
    {
      label: 'מתנדבות פעילות',
      value: activeVolunteers ?? 0,
      gradient: 'from-[var(--brand)] to-[#F7B2C4]',
    },
  ];

  return (
    <AdminLiveDashboard
      initialStats={initialStats}
      initialPending={pendingUsers ?? []}
      initialUrgent={(urgentMeals as unknown as { id: string; date: string; type: string; beneficiary: { user: { name: string } } }[]) ?? []}
      timezone={timezone}
    />
  );
}
