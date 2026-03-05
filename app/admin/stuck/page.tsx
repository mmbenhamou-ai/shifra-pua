import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

// Seuils en heures au-delà desquels un repas est considéré "bloqué"
const STUCK_THRESHOLDS: Record<string, number> = {
  cook_assigned: 6,
  ready: 4,
  driver_assigned: 3,
  picked_up: 2,
};

type StuckMeal = {
  id: string;
  date: string;
  type: string;
  status: string;
  updated_at: string | null;
  cook_name?: string | null;
  driver_name?: string | null;
  ben_name?: string | null;
  hoursStuck: number;
};

async function getStuckMeals(): Promise<StuckMeal[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (user?.role !== 'admin') redirect('/login');

  const now = new Date();
  const results: StuckMeal[] = [];

  for (const [status, hours] of Object.entries(STUCK_THRESHOLDS)) {
    const threshold = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const { data } = await supabase
      .from('meals')
      .select('id, date, type, status, updated_at, cook_id, driver_id, beneficiary:beneficiary_id(user:user_id(name))')
      .eq('status', status)
      .lt('updated_at', threshold.toISOString())
      .order('updated_at', { ascending: true });

    if (data) {
      // Résoudre les noms des cuisinières et livreurs en batch
      const userIds = [
        ...new Set([
          ...data.map((m) => m.cook_id).filter(Boolean),
          ...data.map((m) => m.driver_id).filter(Boolean),
        ]),
      ] as string[];

      const userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds);
        for (const u of users ?? []) {
          if (u.id) userMap[u.id as string] = (u.name as string | null) ?? '—';
        }
      }

      for (const m of data) {
        const updatedAt = m.updated_at ? new Date(m.updated_at as string) : now;
        const hoursStuck = Math.floor((now.getTime() - updatedAt.getTime()) / 3600000);
        const ben = m.beneficiary as { user?: { name?: string | null } | null } | null;
        results.push({
          id: m.id as string,
          date: m.date as string,
          type: m.type as string,
          status: m.status as string,
          updated_at: m.updated_at as string | null,
          cook_name: m.cook_id ? (userMap[m.cook_id as string] ?? null) : null,
          driver_name: m.driver_id ? (userMap[m.driver_id as string] ?? null) : null,
          ben_name: ben?.user?.name ?? null,
          hoursStuck,
        });
      }
    }
  }

  return results.sort((a, b) => b.hoursStuck - a.hoursStuck);
}

// Server Actions admin
async function unlockMeal(formData: FormData) {
  'use server';
  const mealId = formData.get('meal_id') as string;
  const newStatus = formData.get('new_status') as string;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.rpc('admin_unlock_meal', {
    p_meal_id: mealId,
    p_new_status: newStatus,
    p_reason: 'Admin manual unlock from stuck meals dashboard',
  });

  if (error) {
    console.error('[unlockMeal]', error.message);
  }

  revalidatePath('/admin/stuck');
}

const STATUS_LABELS: Record<string, string> = {
  open: 'פתוח',
  cook_assigned: 'בבישול',
  ready: 'מוכן',
  driver_assigned: 'ממתין לאיסוף',
  picked_up: 'באיסוף',
  delivered: 'נמסר',
  confirmed: 'אושר',
};

const TYPE_LABELS: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  shabbat_friday: 'שבת (שישי)',
  shabbat_saturday: 'שבת (שבת)',
};

export default async function StuckMealsPage() {
  const meals = await getStuckMeals();

  return (
    <div className="min-h-screen bg-[#FFF7FB] px-4 py-6" dir="rtl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#811453]">ארוחות תקועות</h1>
        <p className="text-sm text-slate-500 mt-1">
          ארוחות שנמצאות בסטטוס ביניים זמן רב מדי — דורשות התערבות.
        </p>
      </header>

      {meals.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F7D4E2] px-6 py-8 text-center">
          <p className="text-lg font-semibold text-[#811453]">✅ אין ארוחות תקועות</p>
          <p className="text-sm text-slate-500 mt-1">כל הארוחות בסטטוס תקין.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => {
            const cookName = meal.cook_name;
            const driverName = meal.driver_name;
            const benName = meal.ben_name ?? '—';

            return (
              <div
                key={meal.id}
                className="rounded-2xl bg-white border border-[#F7D4E2] px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {benName} · {TYPE_LABELS[meal.type] ?? meal.type}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {new Date(meal.date).toLocaleDateString('he-IL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-[#F7D4E2] px-2 py-0.5 text-[#811453] font-medium">
                        {STATUS_LABELS[meal.status] ?? meal.status}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 font-medium">
                        תקוע {meal.hoursStuck} שעות
                      </span>
                      {cookName && <span>מבשלת: {cookName}</span>}
                      {driverName && <span>מחלקת: {driverName}</span>}
                    </div>
                  </div>

                  {/* Actions admin */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {['cook_assigned'].includes(meal.status) && (
                      <form action={unlockMeal as unknown as (fd: FormData) => void}>
                        <input type="hidden" name="meal_id" value={meal.id} />
                        <input type="hidden" name="new_status" value="open" />
                        <button
                          type="submit"
                          className="rounded-xl bg-amber-100 border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 min-h-[40px]"
                        >
                          החזר לפתוח
                        </button>
                      </form>
                    )}
                    {['ready', 'driver_assigned', 'picked_up'].includes(meal.status) && (
                      <form action={unlockMeal as unknown as (fd: FormData) => void}>
                        <input type="hidden" name="meal_id" value={meal.id} />
                        <input type="hidden" name="new_status" value="ready" />
                        <button
                          type="submit"
                          className="rounded-xl bg-blue-100 border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-900 min-h-[40px]"
                        >
                          החזר למוכן
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
