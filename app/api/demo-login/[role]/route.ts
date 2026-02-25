import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const VALID_ROLES = ['admin', 'cook', 'driver', 'beneficiary', 'cook-driver'] as const;
type DemoRole = typeof VALID_ROLES[number];

type DemoUser = {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'cook' | 'driver' | 'beneficiary';
  also_driver: boolean;
  phone: string;
  address: string;
};

const DEMO_USERS: Record<DemoRole, DemoUser> = {
  admin: {
    email:       'demo-admin@shifra-pua.dev',
    password:    'DemoAdmin123!',
    name:        'אדמין דמו',
    role:        'admin',
    also_driver: false,
    phone:       '0500000001',
    address:     'רחוב הדמו 1, תל אביב',
  },
  cook: {
    email:       'demo-cook@shifra-pua.dev',
    password:    'DemoCook123!',
    name:        'מבשלת דמו',
    role:        'cook',
    also_driver: false,
    phone:       '0500000002',
    address:     'רחוב הבישול 5, ירושלים',
  },
  driver: {
    email:       'demo-driver@shifra-pua.dev',
    password:    'DemoDriver123!',
    name:        'מחלקת דמו',
    role:        'driver',
    also_driver: false,
    phone:       '0500000003',
    address:     'רחוב המשלוח 8, חיפה',
  },
  beneficiary: {
    email:       'demo-beneficiary@shifra-pua.dev',
    password:    'DemoBeneficiary123!',
    name:        'יולדת דמו',
    role:        'beneficiary',
    also_driver: false,
    phone:       '0500000004',
    address:     'רחוב הלידה 3, רמת גן',
  },
  'cook-driver': {
    email:       'demo-cook-driver@shifra-pua.dev',
    password:    'DemoCookDriver123!',
    name:        'מתנדבת דמו',
    role:        'cook',
    also_driver: true,
    phone:       '0500000005',
    address:     'רחוב המתנדבים 10, פתח תקווה',
  },
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role } = await params;
  const roleParam = role as DemoRole;

  if (!VALID_ROLES.includes(roleParam)) {
    return NextResponse.json({ error: 'Rôle demo inconnu' }, { status: 404 });
  }

  const demo = DEMO_USERS[roleParam];

  try {
    const admin = createAdminClient();

    // Vérifier si le user Auth existe déjà
    const { data: existingList, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) {
      return NextResponse.json(
        { error: 'Erreur listUsers', details: listErr.message },
        { status: 500 },
      );
    }

    const existing = existingList?.users?.find((u) => u.email === demo.email);

    let authUserId: string;

    if (existing) {
      authUserId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email:         demo.email,
        password:      demo.password,
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        return NextResponse.json(
          { error: 'Erreur création user demo', details: createErr?.message },
          { status: 500 },
        );
      }
      authUserId = created.user.id;
    }

    // Forcer le mot de passe connu pour le user demo (utile si déjà créé avec un autre password)
    const { error: pwErr } = await admin.auth.admin.updateUserById(authUserId, {
      password: demo.password,
    });
    if (pwErr) {
      return NextResponse.json(
        { error: 'Erreur mise à jour password demo', details: pwErr.message },
        { status: 500 },
      );
    }

    // Upsert dans la table applicative users, basé sur l'id Auth (PK)
    const { error: upsertErr } = await admin.from('users').upsert({
      id:          authUserId,
      email:       demo.email,
      name:        demo.name,
      role:        demo.role,
      phone:       demo.phone,
      address:     demo.address,
      also_driver: demo.also_driver,
      has_car:     demo.also_driver || demo.role === 'driver',
      approved:    true,
    });

    if (upsertErr) {
      return NextResponse.json(
        { error: 'Erreur upsert table users', details: upsertErr.message },
        { status: 500 },
      );
    }

    // Créer un bénéficiaire de démo si nécessaire
    if (demo.role === 'beneficiary') {
      const today = new Date().toISOString().split('T')[0];
      const end   = new Date();
      end.setDate(end.getDate() + 14);
      const endStr = end.toISOString().split('T')[0];

      const { error: benErr } = await admin.from('beneficiaries').upsert({
        user_id:            authUserId,
        start_date:         today,
        end_date:           endStr,
        num_breakfast_days: 14,
        num_shabbat_weeks:  2,
        active:             true,
        is_vegetarian:      false,
        spicy_level:        0,
      });
      if (benErr) {
        // On log l'erreur mais on ne bloque pas la connexion demo
        console.error('Erreur upsert beneficiary demo:', benErr.message);
      }
    }

    return NextResponse.json({
      email:    demo.email,
      password: demo.password,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Erreur inattendue demo-login', details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

