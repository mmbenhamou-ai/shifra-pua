import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkWebhookAuth } from '../_auth';

// n8n polling : repas demain sans cuisinière OU sans livreuse (rappel 24h)
// GET /api/webhooks/reminder-24h
export async function GET(req: NextRequest) {
  const authErr = checkWebhookAuth(req);
  if (authErr) return authErr;

  const admin = createAdminClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Repas demain avec cuisinière assignée → rappel cuisinière
  const { data: cookMeals } = await admin
    .from('meals')
    .select(`
      id, date, type, pickup_time,
      cook:cook_id ( id, name, phone ),
      beneficiary:beneficiary_id (
        is_vegetarian, spicy_level, cooking_notes,
        user:user_id ( name, address )
      ),
      menu:menu_id ( name, items )
    `)
    .eq('date', tomorrowStr)
    .not('cook_id', 'is', null)
    .in('status', ['cook_assigned', 'ready']);

  // Repas demain avec livreuse assignée → rappel livreuse
  const { data: driverMeals } = await admin
    .from('meals')
    .select(`
      id, date, type, pickup_time, delivery_time,
      driver:driver_id ( id, name, phone ),
      cook:cook_id ( name, address ),
      beneficiary:beneficiary_id (
        user:user_id ( name, address, phone )
      )
    `)
    .eq('date', tomorrowStr)
    .not('driver_id', 'is', null)
    .in('status', ['driver_assigned', 'picked_up', 'ready', 'cook_assigned']);

  // Repas demain non couverts (pas de cuisinière) → alerte admin
  const { data: uncoveredMeals } = await admin
    .from('meals')
    .select(`
      id, date, type,
      beneficiary:beneficiary_id(
        user:user_id(name)
      )
    `)
    .eq('date', tomorrowStr)
    .eq('status', 'open');

  return NextResponse.json({
    date: tomorrowStr,
    cook_reminders:    cookMeals   ?? [],
    driver_reminders:  driverMeals ?? [],
    uncovered_meals:   uncoveredMeals ?? [],
  });
}
