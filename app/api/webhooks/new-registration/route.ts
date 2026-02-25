import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkWebhookAuth } from '../_auth';

// n8n polling : GET /api/webhooks/new-registration?since=<ISO_DATE>
export async function GET(req: NextRequest) {
  const authErr = checkWebhookAuth(req);
  if (authErr) return authErr;

  const since = req.nextUrl.searchParams.get('since');

  const admin = createAdminClient();
  let query = admin
    .from('users')
    .select('id, name, role, phone, email, address, approved, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registrations: data });
}

// Supabase DB webhook POST : appelé par un trigger ou n8n sur insert dans users
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Transmet le payload tel quel — n8n peut lire record.new
  return NextResponse.json({ received: true, payload: body });
}
