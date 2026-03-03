import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import { ReserveMealItemButton, ReleaseMealItemButton } from '../CookActions';
import Link from 'next/link';

const ITEM_TYPE_LABELS: Record<string, string> = {
  protein: '🥩 חלבון',
  side: '🥔 תוספת',
  salad: '🥗 סלט',
  soup: '🍲 מרק',
  dessert: '🍮 קינוח',
  other: '🍽️ אחר',
};

export default async function ShabbatCookPage() {
  const { session } = await getSessionOrDevBypass();
  if (!session) redirect('/login');
  const userId = session.user.id;

  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Repas Shabbat futurs avec leurs items
  const { data: shabbatMeals } = await supabase
    .from('meals')
    .select(`
      id, date, type, status,
      beneficiary:beneficiary_id(
        is_vegetarian, spicy_level, cooking_notes,
        user:user_id(name, address, neighborhood)
      ),
      meal_items(id, item_name, item_type, cook_id, reserved_at,
        cook:cook_id(name)
      )
    `)
    .in('type', ['shabbat_friday', 'shabbat_saturday'])
    .gte('date', today)
    .order('date', { ascending: true });

  const meals = shabbatMeals ?? [];

  const TYPE_LABELS: Record<string, string> = {
    shabbat_friday: 'שבת ליל שישי 🕯️',
    shabbat_saturday: 'שבת צהריים ☀️',
  };

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      <header className="flex items-center justify-between pt-1">
        <Link href="/cook"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
          style={{ color: 'var(--brand)' }}>
          ← חזרה
        </Link>
        <h2 className="text-xl font-extrabold" style={{ color: '#1A0A10' }}>ארוחות שבת 🕍</h2>
      </header>

      <p className="text-sm text-zinc-500 text-right">
        בחרי את הפריטים שברצונך להכין. כל פריט יכול להיות מוכן על ידי מבשלת אחת בלבד.
      </p>

      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#F7D4E2] bg-white py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#FBE4F0] text-3xl">✨</div>
          <p className="text-base font-semibold" style={{ color: 'var(--brand)' }}>אין ארוחות שבת קרובות</p>
        </div>
      ) : (
        <div className="space-y-5">
          {meals.map((meal) => {
            const ben = (meal.beneficiary as { is_vegetarian?: boolean; spicy_level?: number; cooking_notes?: string; user?: { name?: string; address?: string; neighborhood?: string } } | null);
            const benUser = ben?.user;
            const items = (meal.meal_items as { id: string; item_name: string; item_type: string; cook_id: string | null; reserved_at: string | null; cook?: { name?: string } }[]) ?? [];

            const totalItems = items.length;
            const coveredItems = items.filter((i) => i.cook_id).length;
            const allCovered = totalItems > 0 && totalItems === coveredItems;
            const myItems = items.filter((i) => i.cook_id === userId);

            return (
              <div key={meal.id as string}
                className="overflow-hidden rounded-3xl bg-white"
                style={{ boxShadow: '0 4px 20px rgba(129,20,83,0.10)' }}>

                {/* Header */}
                <div className="px-5 pt-4 pb-3"
                  style={{
                    background: allCovered
                      ? 'linear-gradient(135deg,#059669,#10B981)'
                      : 'linear-gradient(135deg,var(--brand),#4A0731)'
                  }}>
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {allCovered ? '✓ מכוסה לגמרי' : `${coveredItems}/${totalItems} פריטים`}
                    </span>
                    <div className="text-right">
                      <p className="text-base font-bold text-white">{TYPE_LABELS[meal.type as string] ?? meal.type}</p>
                      <p className="text-xs text-white/70">
                        {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {/* יולדת info */}
                  {benUser && (
                    <div className="rounded-2xl bg-[#FFF7FB] px-3 py-2.5 text-right">
                      <p className="text-sm font-bold text-zinc-900">👶 {benUser.name}</p>
                      {benUser.address && <p className="text-xs text-zinc-500 mt-0.5">📍 {benUser.address}</p>}
                    </div>
                  )}

                  {/* Préférences */}
                  {ben && (ben.is_vegetarian || ben.cooking_notes) && (
                    <div className="space-y-1">
                      {ben.is_vegetarian && (
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>🥗 צמחוני</span>
                      )}
                      {ben.cooking_notes && (
                        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          ⚠️ {ben.cooking_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items list */}
                  {totalItems === 0 ? (
                    <p className="text-sm text-zinc-400 text-right">לא נוספו פריטים לארוחה זו</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-[#F7D4E2]">
                      <div className="bg-[#FBE4F0] px-4 py-2 text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>פריטים להכנה</p>
                      </div>
                      <ul className="divide-y divide-[#FBE4F0] bg-white">
                        {items.map((item) => {
                          const isMine = item.cook_id === userId;
                          const isTaken = !!item.cook_id && !isMine;

                          return (
                            <li key={item.id}
                              className="flex items-center justify-between px-4 py-3"
                              style={{ opacity: isTaken ? 0.55 : 1 }}>
                              <div className="flex items-center gap-2">
                                {isTaken && (
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                                    לקוח ע&quot;י {item.cook?.name ?? '?'}
                                  </span>
                                )}
                                {isMine && <ReleaseMealItemButton itemId={item.id} />}
                                {!item.cook_id && <ReserveMealItemButton itemId={item.id} itemName={item.item_name} />}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-zinc-900">{item.item_name}</p>
                                <p className="text-[10px] text-zinc-400">{ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Mes items récapitulatif */}
                  {myItems.length > 0 && (
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
                      <p className="text-xs font-semibold text-emerald-700">
                        ✓ לקחת על עצמך: {myItems.map((i) => i.item_name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
