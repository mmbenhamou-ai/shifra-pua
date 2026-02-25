import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const VALID_ROLES = ['admin', 'cook', 'driver', 'beneficiary', 'cook-driver'] as const;
type DemoRole = typeof VALID_ROLES[number];

const DEMO_USERS: Record<DemoRole, {
  email: string;
  name: string;
  role: 'admin' | 'cook' | 'driver' | 'beneficiary';
  also_driver: boolean;
  phone: string;
  address: string;
}> = {
  admin: {
    email:       'demo-admin@shifra-pua.dev',
    name:        'אדמין דמו',
    role:        'admin',
    also_driver: false,
    phone:       '0500000001',
    address:     'רחוב הדמו 1, תל אביב',
  },
  cook: {
    email:       'demo-cook@shifra-pua.dev',
    name:        'מבשלת דמו',
    role:        'cook',
    also_driver: false,
    phone:       '0500000002',
    address:     'רחוב הבישול 5, ירושלים',
  },
  driver: {
    email:       'demo-driver@shifra-pua.dev',
    name:        'מחלקת דמו',
    role:        'driver',
    also_driver: false,
    phone:       '0500000003',
    address:     'רחוב המשלוח 8, חיפה',
  },
  beneficiary: {
    email:       'demo-beneficiary@shifra-pua.dev',
    name:        'יולדת דמו',
    role:        'beneficiary',
    also_driver: false,
    phone:       '0500000004',
    address:     'רחוב הלידה 3, רמת גן',
  },
  'cook-driver': {
    email:       'demo-cook-driver@shifra-pua.dev',
    name:        'מתנדבת דמו',
    role:        'cook',
    also_driver: true,
    phone:       '0500000005',
    address:     'רחוב המתנדבים 10, פתח תקווה',
  },
};

const ROLE_REDIRECTS: Record<string, string> = {
  admin:       '/admin',
  cook:        '/cook',
  driver:      '/driver',
  beneficiary: '/beneficiary',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role: roleParam } = await params;
  const token = req.nextUrl.searchParams.get('token');

  // Vérification du token
  const expectedToken = process.env.DEMO_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 });
  }

  // Vérification du rôle
  if (!VALID_ROLES.includes(roleParam as DemoRole)) {
    return NextResponse.json({ error: 'Rôle inconnu' }, { status: 404 });
  }

  const demoUser = DEMO_USERS[roleParam as DemoRole];
  const admin    = createAdminClient();

  // Trouver ou créer l'utilisateur Supabase Auth
  let authUserId: string;

  const { data: existingList } = await admin.auth.admin.listUsers();
  const existing = existingList?.users?.find((u) => u.email === demoUser.email);

  if (existing) {
    authUserId = existing.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email:          demoUser.email,
      password:       `Demo_${Math.random().toString(36).slice(2)}!`,
      email_confirm:  true,
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: 'Erreur création user', details: createErr?.message }, { status: 500 });
    }
    authUserId = created.user.id;
  }

  // Upsert dans la table users
  await admin.from('users').upsert({
    id:           authUserId,
    email:        demoUser.email,
    name:         demoUser.name,
    role:         demoUser.role,
    phone:        demoUser.phone,
    address:      demoUser.address,
    also_driver:  demoUser.also_driver,
    has_car:      demoUser.also_driver || demoUser.role === 'driver',
    approved:     true,
  });

  // Upsert beneficiary si rôle יולדת
  if (demoUser.role === 'beneficiary') {
    const today = new Date().toISOString().split('T')[0];
    const end   = new Date(); end.setDate(end.getDate() + 14);
    await admin.from('beneficiaries').upsert({
      user_id:           authUserId,
      start_date:        today,
      end_date:          end.toISOString().split('T')[0],
      num_breakfast_days: 14,
      num_shabbat_weeks:  2,
      active:            true,
      is_vegetarian:     false,
      spicy_level:       0,
    });
  }

  // Générer un magic link pour créer la session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type:  'magiclink',
    email: demoUser.email,
    options: {
      redirectTo: `${req.nextUrl.origin}/demo/callback`,
    },
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Erreur génération lien', details: linkErr?.message }, { status: 500 });
  }

  // Rediriger vers le magic link Supabase qui crée la session
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const confirmUrl     = `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${req.nextUrl.origin}/demo/callback?role=${demoUser.role}`;

  return NextResponse.redirect(confirmUrl);
}
