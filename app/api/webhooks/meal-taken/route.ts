import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkWebhookAuth } from '../_auth';

// n8n polling : repas qui viennent d'être assignés à une מבשלת
// GET /api/webhooks/meal-taken?since=<ISO_DATE>
export async function GET(req: NextRequest) {
  const authErr = checkWebhookAuth(req);
  if (authErr) return authErr;

  const since = req.nextUrl.searchParams.get('since');

  const admin = createAdminClient();
  let query = admin
    .from('meals')
    .select(`
      id, date, type, status,
      cook:cook_id ( id, name, phone ),
      beneficiary:beneficiary_id (
        user:user_id ( name, phone, address )
      )
    `)
    .eq('status', 'cook_assigned')
    .order('date', { ascending: true })
    .limit(50);

  if (since) {
    query = query.gte('date', since);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meals: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ received: true, payload: body });
}
