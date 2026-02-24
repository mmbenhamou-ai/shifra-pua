import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_EMAIL = 'test@shifra-pua.dev';
const TEST_PASSWORD = 'devpassword123';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev login disabled in production' },
      { status: 403 },
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase service role configuration missing' },
      { status: 500 },
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        dev: true,
        role: 'admin',
      },
    });

    console.log('[dev-login][createUser][raw-response]', {
      email: TEST_EMAIL,
      data,
      error,
    });

    return NextResponse.json({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      data,
      error,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Unexpected error in dev-login',
        details: String(err),
      },
      { status: 500 },
    );
  }
}

