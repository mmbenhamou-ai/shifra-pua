'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function registerUser(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const role   = formData.get('role') as string;
  const name   = (formData.get('name')  as string).trim();
  const phone  = (formData.get('phone') as string).trim();

  if (!role || !name || !phone) throw new Error('נא למלא את כל השדות החובה');

  const address       = (formData.get('address')      as string | null)?.trim() ?? null;
  const neighborhood  = (formData.get('neighborhood') as string | null)?.trim() ?? null;
  const email         = (formData.get('email')        as string | null)?.trim() || null;
  const has_car       = formData.get('has_car') === 'true';
  const also_driver   = formData.get('also_driver')   === 'true';
  const notif_cooking = formData.get('notif_cooking')  !== 'false';
  const notif_delivery= formData.get('notif_delivery') !== 'false';

  const admin = createAdminClient();

  // Vérifie qu'aucun autre compte n'utilise déjà ce numéro
  const { data: existingByPhone, error: phoneCheckError } = await admin
    .from('users')
    .select('id')
    .eq('phone', phone)
    .neq('id', userId)
    .maybeSingle();

  if (phoneCheckError) {
    console.error('[registerUser][phone-check]', phoneCheckError);
    throw new Error('שגיאה בבדיקת מספר הטלפון, נסי שוב מאוחר יותר');
  }

  if (existingByPhone) {
    throw new Error('Ce numéro de téléphone est déjà associé à un autre compte');
  }

  const { error: userError } = await admin.from('users').upsert({
    id: userId,
    phone,
    name,
    role,
    address,
    neighborhood,
    email,
    has_car:        role === 'driver' || also_driver ? has_car || also_driver : null,
    also_driver:    role === 'cook' ? also_driver : false,
    notif_cooking,
    notif_delivery,
    approved: false,
  });

  if (userError) {
    console.error('[registerUser][users]', userError);
    throw new Error('שגיאה בשמירת הפרטים: ' + userError.message);
  }

  if (role === 'beneficiary') {
    const today      = new Date().toISOString().split('T')[0];
    const rawStart   = (formData.get('start_date') as string | null) ?? today;
    const start_date = rawStart < today ? today : rawStart;
    const birth_date = (formData.get('birth_date') as string | null) || null;

    // Nouveaux champs Phase 6
    const num_adults      = parseInt(formData.get('num_adults')   as string) || 2;
    const num_children    = parseInt(formData.get('num_children') as string) || 0;
    const is_vegetarian   = formData.get('is_vegetarian')   === 'true';
    const spicy_level     = parseInt(formData.get('spicy_level')  as string) || 0;
    const cooking_notes   = (formData.get('cooking_notes')   as string | null)?.trim() || null;
    const shabbat_friday  = formData.get('shabbat_friday')   === 'true';
    const shabbat_saturday= formData.get('shabbat_saturday') === 'true';
    const shabbat_kashrut = (formData.get('shabbat_kashrut') as string | null) ?? 'רגיל';

    const { error: benError } = await admin.from('beneficiaries').upsert({
      user_id:          userId,
      birth_date,
      start_date,
      num_breakfast_days: 14,
      num_shabbat_weeks:   2,
      active:           false,
      // Phase 6
      num_adults,
      num_children,
      is_vegetarian,
      spicy_level,
      cooking_notes,
      shabbat_friday,
      shabbat_saturday,
      shabbat_kashrut,
    });

    if (benError) {
      console.error('[registerUser][beneficiaries]', benError);
      throw new Error('שגיאה בשמירת פרטי היולדת: ' + benError.message);
    }
  }

  redirect('/signup/pending');
}
