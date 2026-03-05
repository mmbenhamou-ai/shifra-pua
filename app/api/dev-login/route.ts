import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const TEST_EMAIL    = 'test@shifra-pua.dev';
const TEST_PASSWORD = 'devpassword123';

const ROLE_EMAILS: Record<string, string> = {
  admin:    'test-admin@shifra-pua.dev',
  yoledet:  'test-yoledet@shifra-pua.dev',
  cook:     'test-cook@shifra-pua.dev',
  deliverer: 'test-deliverer@shifra-pua.dev',
};
const ROLE_PASSWORD = 'testpassword123';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev login disabled in production' }, { status: 403 });
  }

  try {
    let body: { role?: string } = {};
    try {
      body = await req.json();
    } catch {
      // no body
    }
    const role = body.role as string | undefined;
    if (role && ['admin', 'yoledet', 'cook', 'deliverer'].includes(role)) {
      return NextResponse.json({
        email: ROLE_EMAILS[role],
        password: ROLE_PASSWORD,
      });
    }

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
