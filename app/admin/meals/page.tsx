import { createClient } from '@supabase/supabase-js';
import MealStatusSelect from './MealStatusSelect';
import AssignSelect from './AssignSelect';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  open:            { label: 'פנויה',          bg: '#FEF3C7', color: '#92400E' },
  cook_assigned:   { label: 'יש מבשלת',       bg: '#DBEAFE', color: '#1E40AF' },
  ready:           { label: 'מוכנה',          bg: '#D1FAE5', color: '#065F46' },
  driver_assigned: { label: 'יש מחלקת',       bg: '#EDE9FE', color: '#5B21B6' },
  picked_up:       { label: 'נאסף',           bg: '#FED7AA', color: '#9A3412' },
  delivered:       { label: 'נמסר',           bg: '#E0E7FF', color: '#3730A3' },
  confirmed:       { label: 'אושר ✓',         bg: '#F3F4F6', color: '#374151' },
};

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

const STATUS_FILTERS = [
  { key: 'all',            label: 'הכל' },
  { key: 'open',           label: 'פנויות' },
  { key: 'cook_assigned',  label: 'מבשלת' },
  { key: 'ready',          label: 'מוכנות' },
  { key: 'driver_assigned',label: 'מחלקת' },
  { key: 'picked_up',      label: 'נאספו' },
  { key: 'delivered',      label: 'נמסרו' },
  { key: 'confirmed',      label: 'אושרו' },
];

export default async function MealsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string; type?: string }>;
}) {
  const { status = 'all', date, type } = await searchParams;
  const admin = adminClient();

  let query = admin
    .from('meals')
    .select(`
      id, date, type, status, cook_id, driver_id,
      menu:menu_id(name),
      cook:cook_id(id, name),
      driver:driver_id(id, name),
      beneficiary:beneficiary_id(user:user_id(name, address))
    `)
    .order('date', { ascending: false })
    .limit(100);

  if (status !== 'all') query = query.eq('status', status);
  if (date) query = query.eq('date', date);
  if (type && type !== 'all') query = query.eq('type', type);

  const { data: meals } = await query;

  const { data: cooks } = await admin
    .from('users')
    .select('id, name')
    .eq('role', 'cook')
    .eq('approved', true)
    .order('name');

  const { data: drivers } = await admin
    .from('users')
    .select('id, name')
    .eq('role', 'driver')
    .eq('approved', true)
    .order('name');

  const list        = meals   ?? [];
  const cookList    = (cooks  ?? []).map((c) => ({ id: c.id as string, name: c.name as string }));
  const driverList  = (drivers ?? []).map((d) => ({ id: d.id as string, name: d.name as string }));

  return (
    <div className="space-y-5 pb-4" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>ניהול ארוחות</h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>{list.length} ארוחות נמצאו</p>
      </header>

      {/* פילטרים */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/admin/meals?status=${f.key}${date ? `&date=${date}` : ''}${type ? `&type=${type}` : ''}`}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition"
              style={{
                backgroundColor: status === f.key ? '#811453' : '#FBE4F0',
                color:           status === f.key ? '#FFFFFF' : '#811453',
              }}
            >
              {f.label}
            </a>
          ))}
        </div>

        <div className="flex gap-2">
          <form method="GET" action="/admin/meals" className="flex flex-1 gap-2">
            {status !== 'all' && <input type="hidden" name="status" value={status} />}
            <input
              type="date"
              name="date"
              defaultValue={date ?? ''}
              className="flex-1 rounded-xl border border-[#F7D4E2] px-3 py-2 text-sm text-zinc-800 focus:outline-none"
            />
            <select
              name="type"
              defaultValue={type ?? 'all'}
              className="flex-1 rounded-xl border border-[#F7D4E2] bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none"
            >
              <option value="all">כל הסוגים</option>
              <option value="breakfast">ארוחת בוקר</option>
              <option value="shabbat_friday">שבת ליל</option>
              <option value="shabbat_saturday">שבת צהריים</option>
            </select>
            <button
              type="submit"
              className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: '#811453' }}
            >
              סנן
            </button>
          </form>
        </div>
      </div>

      {/* רשימה */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">אין ארוחות לפי הפילטר הנוכחי.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((meal) => {
            const st     = STATUS_META[meal.status as string] ?? STATUS_META['open'];
            const cookObj   = meal.cook   as { id?: string; name?: string } | null;
            const driverObj = meal.driver as { id?: string; name?: string } | null;
            const ben    = (meal.beneficiary as { user?: { name?: string; address?: string } } | null)?.user;
            const menu   = (meal.menu as { name?: string } | null)?.name;

            return (
              <li key={meal.id as string}
                  className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#FBE4F0] px-4 py-2.5">
                  <MealStatusSelect mealId={meal.id as string} current={meal.status as string} />
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900">
                      {TYPE_LABELS[meal.type as string] ?? meal.type}
                      {menu && <span className="ml-1 text-xs font-normal text-zinc-500">({menu})</span>}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(meal.date as string).toLocaleDateString('he-IL', {
                        weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="px-4 py-3 space-y-2">
                  {ben && (
                    <p className="text-xs text-zinc-600 text-right">
                      👶 {ben.name}{ben.address ? <span className="text-zinc-400"> · {ben.address}</span> : null}
                    </p>
                  )}

                  <AssignSelect
                    mealId={meal.id as string}
                    type="cook"
                    currentId={meal.cook_id as string | null}
                    volunteers={cookList}
                  />

                  <AssignSelect
                    mealId={meal.id as string}
                    type="driver"
                    currentId={meal.driver_id as string | null}
                    volunteers={driverList}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
