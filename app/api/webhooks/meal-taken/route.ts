import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { checkWebhookAuth } from '../_auth';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// n8n polling : repas qui viennent d'être assignés à une מבשלת
// GET /api/webhooks/meal-taken?since=<ISO_DATE>
export async function GET(req: NextRequest) {
  const authErr = checkWebhookAuth(req);
  if (authErr) return authErr;

  const since = req.nextUrl.searchParams.get('since');

  const admin = adminClient();
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
