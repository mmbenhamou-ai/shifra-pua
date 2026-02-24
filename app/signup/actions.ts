'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Client admin qui bypasse le RLS — utilisé uniquement après vérification de session
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function registerUser(formData: FormData) {
  // Vérifie la session avec le client normal (anon)
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;
  const role = formData.get('role') as string;
  const name = (formData.get('name') as string).trim();
  const phone = (formData.get('phone') as string).trim();
  const address = (formData.get('address') as string | null)?.trim() ?? null;
  const neighborhood = (formData.get('neighborhood') as string | null)?.trim() ?? null;
  const has_car = formData.get('has_car') === 'true';
  const birth_date = (formData.get('birth_date') as string | null) ?? null;

  if (!role || !name || !phone) {
    throw new Error('נא למלא את כל השדות החובה');
  }

  // Toutes les écritures passent par le client admin pour bypasser le RLS
  const admin = createAdminClient();

  const { error: userError } = await admin.from('users').upsert({
    id: userId,
    phone,
    name,
    role,
    address,
    neighborhood,
    has_car: role === 'driver' ? has_car : null,
    approved: false,
  });

  if (userError) {
    console.error('[registerUser][users]', userError);
    throw new Error('שגיאה בשמירת הפרטים: ' + userError.message);
  }

  // Pour les יולדות, créer aussi la ligne dans beneficiaries
  if (role === 'beneficiary') {
    const start_date = (formData.get('start_date') as string | null) ?? new Date().toISOString().split('T')[0];
    const { error: benError } = await admin.from('beneficiaries').upsert({
      user_id: userId,
      birth_date: birth_date ?? null,
      start_date,
      num_breakfast_days: 14,
      num_shabbat_weeks: 2,
      active: false,
    });

    if (benError) {
      console.error('[registerUser][beneficiaries]', benError);
    }
  }

  redirect('/signup/pending');
}
