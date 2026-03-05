import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// Seuils en heures avant reset automatique
const STUCK_RULES = [
  { status: 'cook_assigned', field: 'cook_id', nextStatus: 'open',  maxHours: 12 },
  { status: 'driver_assigned', field: 'driver_id', nextStatus: 'ready', maxHours: 6 },
  { status: 'picked_up',       field: 'driver_id', nextStatus: 'ready', maxHours: 4 },
] as const;

export async function GET(request: Request) {
  // Vérification du secret cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const recovered: { mealId: string; from: string; to: string }[] = [];
  const errors: string[] = [];

  for (const rule of STUCK_RULES) {
    const threshold = new Date(now.getTime() - rule.maxHours * 3600000);

    const { data: stuckMeals, error: fetchErr } = await admin
      .from('meals')
      .select('id, status, updated_at')
      .eq('status', rule.status)
      .lt('updated_at', threshold.toISOString());

    if (fetchErr) {
      errors.push(`fetch ${rule.status}: ${fetchErr.message}`);
      continue;
    }

    for (const meal of stuckMeals ?? []) {
      // Reset via UPDATE direct (admin service_role, bypass RLS)
      const updatePayload: Record<string, unknown> = {
        status: rule.nextStatus,
        updated_at: now.toISOString(),
      };
      updatePayload[rule.field] = null;

      const { error: updateErr } = await admin
        .from('meals')
        .update(updatePayload)
        .eq('id', meal.id)
        .eq('status', rule.status); // Guard atomique

      if (updateErr) {
        errors.push(`update ${meal.id}: ${updateErr.message}`);
        continue;
      }

      // Log audit
      await admin.from('admin_audit_log').insert({
        action: 'cron_recover_stuck',
        target_id: meal.id,
        details: {
          from: rule.status,
          to: rule.nextStatus,
          threshold_hours: rule.maxHours,
          updated_at: meal.updated_at,
        },
      });

      recovered.push({ mealId: meal.id as string, from: rule.status, to: rule.nextStatus });
    }
  }

  if (errors.length > 0) {
    console.error('[cron/recover-stuck] errors:', errors);
  }

  console.log(`[cron/recover-stuck] recovered ${recovered.length} meals`, recovered);

  return NextResponse.json({
    ok: true,
    recovered: recovered.length,
    details: recovered,
    errors: errors.length > 0 ? errors : undefined,
  });
}
