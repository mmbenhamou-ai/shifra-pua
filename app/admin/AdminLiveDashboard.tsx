'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { Smartphone, UserPlus, CalendarDays, ClipboardList, BarChart3 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getNowInTimezone } from '@/lib/utils';
import { approveUser, rejectUser } from './actions/registrations';

type StatBlock = {
  label: string;
  value: number;
  gradient: string;
};

type PendingUser = {
  id: string;
  display_name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  created_at: string;
};

type UrgentMeal = {
  id: string;
  date: string;
  type?: string;
  beneficiary?: { user?: { name?: string | null } | null } | null;
};

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'יולדת',
  cook: 'מבשלת',
  driver: 'מחלקת',
  admin: 'אדמין',
};

const TYPE_LABELS: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  shabbat_friday: 'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

type Props = {
  initialStats: StatBlock[];
  initialPending: PendingUser[];
  initialUrgent: UrgentMeal[];
  timezone: string;
};

function ApproveButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await approveUser(userId);
            if (result && 'error' in result) {
              setError(result.error);
            }
          });
        }}
        className="min-h-[44px] min-w-[80px] rounded-full text-sm font-semibold text-white transition active:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: 'var(--brand)' }}
      >
        {isPending ? '...' : 'אישור ✓'}
      </button>
      {error && (
        <p className="text-[10px] text-red-600 max-w-[200px] text-right">{error}</p>
      )}
    </div>
  );
}

export default function AdminLiveDashboard({
  initialStats,
  initialPending,
  initialUrgent,
  timezone,
}: Props) {
  const [stats, setStats] = useState<StatBlock[]>(initialStats);
  const [pending, setPending] = useState<PendingUser[]>(initialPending);
  const [urgent, setUrgent] = useState<UrgentMeal[]>(initialUrgent);
  const [live, setLive] = useState(false);
  const [bump, setBump] = useState(false);

  const refreshUserStats = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    const [{ count: activeBeneficiaries }, { count: activeVolunteers }, { data: pendingUsers }] =
      await Promise.all([
      supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'beneficiary')
          .eq('approved', true),
      supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .in('role', ['cook', 'driver', 'both'])
          .eq('approved', true),
      supabase
          .from('users')
          .select('id, name, role, phone, neighborhood, created_at')
          .eq('approved', false)
          .order('created_at', { ascending: false }),
      ]);

    setStats((prev) =>
      prev.map((s) => {
        if (s.label === 'יולדות פעילות') {
          return { ...s, value: activeBeneficiaries ?? 0 };
        }
        if (s.label === 'מתנדבות פעילות') {
          return { ...s, value: activeVolunteers ?? 0 };
        }
        return s;
      }),
    );
    setPending(
      (pendingUsers ?? []).map((u) => ({
        id: u.id as string,
        display_name: (u as { name?: string | null }).name ?? '',
        role: u.role as string,
        phone: (u as { phone?: string | null }).phone ?? null,
        email: null,
        city: (u as { neighborhood?: string | null }).neighborhood ?? null,
        created_at: u.created_at as string,
      })),
    );
    setBump(true);
  }, []);

  const refreshMealStats = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    const now = getNowInTimezone(timezone);
    const today = now.toISOString().split('T')[0];
    const in7days = new Date(now);
    in7days.setDate(in7days.getDate() + 7);
    const next7 = in7days.toISOString().split('T')[0];
    const in24h = new Date(now);
    in24h.setHours(in24h.getHours() + 24);
    const next24hDate = in24h.toISOString().split('T')[0];

    const [{ count: mealsToday }, { count: openMealsNext7 }, { data: urgentMeals }] = await Promise.all([
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
        .from('meals')
        .select('id, date, type, beneficiary:beneficiary_id(user:user_id(name))')
        .eq('status', 'open')
        .gte('date', today)
        .lte('date', next24hDate)
        .order('date', { ascending: true })
        .limit(20),
    ]);

    setStats((prev) =>
      prev.map((s) => {
        if (s.label === 'ארוחות היום') {
          return { ...s, value: mealsToday ?? 0 };
        }
        if (s.label === 'ארוחות פנויות (7 ימים)') {
          return { ...s, value: openMealsNext7 ?? 0 };
        }
        return s;
      }),
    );
    setUrgent((urgentMeals as UrgentMeal[]) ?? []);
    setBump(true);
  }, [timezone]);

  useEffect(() => {
    if (!bump) return;
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [bump]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          refreshUserStats().catch(() => { });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals' },
        () => {
          refreshMealStats().catch(() => { });
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setLive(true);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshUserStats, refreshMealStats]);

  return (
    <div className="space-y-6 pb-2" dir="rtl">
      <header className="space-y-1 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>
            דשבורד אדמין
          </h1>
          <p className="text-sm" style={{ color: '#7C365F' }}>
            תמונת מצב כללית של המערכת להיום.
          </p>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-[pulse_1s_ease-in-out_infinite]" />
            מחובר בשידור חי
          </span>
        )}
      </header>

      {/* ── התראה: ארוחות לא מכוסות ב-24 שעות הקרובות ── */}
      {urgent.length > 0 && (
        <section className="overflow-hidden rounded-2xl border-2 border-red-400 bg-red-50 shadow-md">
          <div className="flex items-center justify-between bg-red-500 px-4 py-2.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-red-600">
              {urgent.length} ארוחות
            </span>
            <p className="text-sm font-bold text-white">
              🚨 ארוחות לא מכוסות — 24 שעות הקרובות
            </p>
          </div>
          <ul className="divide-y divide-red-100 px-4">
            {urgent.map((m) => {
              const meal = m as UrgentMeal;
              const benName = meal.beneficiary?.user?.name ?? undefined;
              const typeLabel = TYPE_LABELS[meal.type ?? ''] ?? meal.type;
              return (
                <li key={meal.id} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-red-600">
                    {new Date(meal.date).toLocaleDateString('he-IL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric',
                    })}
                  </span>
                  <span className="text-sm font-medium text-red-800 text-right">
                    {typeLabel}
                    {benName ? <span className="text-xs text-red-500"> — {benName}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="px-4 pb-3">
            <a
              href="/admin/announcements"
              className="block min-h-[44px] w-full rounded-xl bg-red-500 pt-2.5 text-center text-sm font-bold text-white transition active:opacity-80"
            >
              שלחי הודעה למתנדבות →
            </a>
          </div>
        </section>
      )}

      {/* ── Stats 2×2 ── */}
      <section className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl bg-gradient-to-br ${item.gradient} p-[1px] shadow-sm`}
            style={{ minHeight: 72 }}
          >
            <div
              className={`flex h-full w-full flex-col items-end justify-center rounded-2xl bg-white/95 px-4 py-3 transition-transform ${bump ? 'scale-105' : 'scale-100'
                }`}
            >
              <span className="text-xs leading-tight" style={{ color: 'var(--brand)' }}>
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

      {/* ── Actions rapides ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-right" style={{ color: 'var(--brand)' }}>
          מה תרצי לעשות עכשיו?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/admin/registrations"
            className="group rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right shadow-sm active:scale-[0.98] transition hover:shadow-md hover:border-[#91006A]/30"
          >
            <div className="mb-2 text-[#91006A] transition-transform group-hover:scale-110">
              <UserPlus size={20} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">אישור הרשמות</p>
            <p className="text-[11px] text-zinc-500">יולדות ומתנדבות חדשות</p>
          </a>
          <a
            href="/admin/calendar"
            className="group rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right shadow-sm active:scale-[0.98] transition hover:shadow-md hover:border-[#91006A]/30"
          >
            <div className="mb-2 text-[#91006A] transition-transform group-hover:scale-110">
              <CalendarDays size={20} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">לוח ארוחות</p>
            <p className="text-[11px] text-zinc-500">כיסוי הארוחות בשבוע</p>
          </a>
          <a
            href="/admin/meals"
            className="group rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right shadow-sm active:scale-[0.98] transition hover:shadow-md hover:border-[#91006A]/30"
          >
            <div className="mb-2 text-[#91006A] transition-transform group-hover:scale-110">
              <ClipboardList size={20} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">ניהול ארוחות</p>
            <p className="text-[11px] text-zinc-500">עריכה, מחיקה ושיבוץ</p>
          </a>
          <a
            href="/admin/stats"
            className="group rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right shadow-sm active:scale-[0.98] transition hover:shadow-md hover:border-[#91006A]/30"
          >
            <div className="mb-2 text-[#91006A] transition-transform group-hover:scale-110">
              <BarChart3 size={20} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">סטטיסטיקות</p>
            <p className="text-[11px] text-zinc-500">מעקב אחר פעילות</p>
          </a>
        </div>
      </section>

      {/* ── Inscriptions en attente ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--brand)' }}>
            הרשמות ממתינות לאישור
          </h2>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: '#F7D4E2', color: 'var(--brand)' }}
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
                        {u.display_name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{ backgroundColor: '#FBE4F0', color: 'var(--brand)' }}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap flex-row-reverse gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                      {u.phone && (
                        <a href={`tel:${u.phone}`} className="hover:underline flex items-center gap-1 font-semibold" style={{ color: 'var(--brand)' }}>
                          <span>{u.phone}</span>
                          <Smartphone size={12} />
                        </a>
                      )}
                      {u.city && (
                        <span className="flex items-center gap-1">
                          <span>{u.city}</span>
                          <span className="opacity-50">•</span>
                        </span>
                      )}
                      <span>{new Date(u.created_at).toLocaleDateString('he-IL')}</span>
                    </div>

                    <div className="mt-2 flex w-full justify-start gap-2 items-start">
                      <ApproveButton userId={u.id} />

                      <form action={rejectUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="min-h-[44px] min-w-[80px] rounded-full border text-sm font-semibold transition active:opacity-80"
                          style={{
                            borderColor: '#F7D4E2',
                            color: 'var(--brand)',
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

