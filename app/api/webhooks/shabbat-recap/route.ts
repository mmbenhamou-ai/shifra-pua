import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkWebhookAuth } from '../_auth';

// n8n polling : récap Shabbat par cuisinière (jeudi soir)
// GET /api/webhooks/shabbat-recap?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const authErr = checkWebhookAuth(req);
  if (authErr) return authErr;

  const admin = createAdminClient();

  // Par défaut : prochain vendredi
  const dateParam = req.nextUrl.searchParams.get('date');
  let shabbatDate: string;

  if (dateParam) {
    shabbatDate = dateParam;
  } else {
    const d = new Date();
    const day = d.getDay(); // 0=dimanche, 5=vendredi
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFriday);
    shabbatDate = d.toISOString().split('T')[0];
  }

  // Tous les items Shabbat de ce vendredi avec leur cuisinière
  const { data: items } = await admin
    .from('meal_items')
    .select(`
      id, item_name, item_type,
      cook:cook_id ( id, name, phone ),
      meal:meal_id (
        date, type,
        beneficiary:beneficiary_id (
          is_vegetarian, spicy_level, cooking_notes,
          user:user_id ( name, address )
        )
      )
    `)
    .not('cook_id', 'is', null)
    .eq('meal.date', shabbatDate);

  // Grouper par cuisinière
  const byCook: Record<string, {
    cook: { id: string; name: string; phone: string };
    items: { item_name: string; item_type: string; beneficiary: object }[];
  }> = {};

  for (const item of items ?? []) {
    const cook = item.cook as unknown as { id: string; name: string; phone: string } | null;
    if (!cook) continue;
    if (!byCook[cook.id]) byCook[cook.id] = { cook, items: [] };
    byCook[cook.id].items.push({
      item_name: item.item_name,
      item_type: item.item_type,
      beneficiary: (item.meal as { beneficiary?: object } | null)?.beneficiary ?? {},
    });
  }

  return NextResponse.json({
    shabbat_date: shabbatDate,
    by_cook:      Object.values(byCook),
  });
}
