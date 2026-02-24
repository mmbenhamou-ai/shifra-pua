import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// n8n polling : GET /api/webhooks/registration-approved?since=<ISO_DATE>
export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since');

  const admin = adminClient();
  let query = admin
    .from('users')
    .select('id, name, role, phone, address, approved, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ approved_users: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ received: true, payload: body });
}
