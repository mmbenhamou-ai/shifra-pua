import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkWebhookAuth } from '../_auth';

// n8n polling : repas dans 48h encore sans cuisinière → alerte admin + volontaires
// GET /api/webhooks/uncovered-48h
export async function GET(req: NextRequest) {
  const authErr = checkWebhookAuth(req);
  if (authErr) return authErr;

  const admin = createAdminClient();

  const in48h = new Date();
  in48h.setDate(in48h.getDate() + 2);
  const in48hStr = in48h.toISOString().split('T')[0];

  const { data: uncovered } = await admin
    .from('meals')
    .select(`
      id, date, type,
      beneficiary:beneficiary_id(
        user:user_id(name, address, neighborhood)
      )
    `)
    .eq('date', in48hStr)
    .eq('status', 'open');

  // Liste des cuisinières approuvées pour envoi d'alerte groupée
  const { data: cooks } = await admin
    .from('users')
    .select('id, name, phone')
    .eq('role', 'cook')
    .eq('approved', true);

  return NextResponse.json({
    date:            in48hStr,
    uncovered_meals: uncovered ?? [],
    cook_volunteers: cooks     ?? [],
  });
}
