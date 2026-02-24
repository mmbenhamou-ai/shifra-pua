import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const TEST_EMAIL    = 'test@shifra-pua.dev';
const TEST_PASSWORD = 'devpassword123';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev login disabled in production' }, { status: 403 });
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { dev: true, role: 'admin' },
    });

    return NextResponse.json({ email: TEST_EMAIL, password: TEST_PASSWORD, data, error });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected error in dev-login', details: String(err) },
      { status: 500 },
    );
  }
}
