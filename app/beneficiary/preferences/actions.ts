'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function updateShabbatPreferences(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();

  const is_vegetarian    = formData.get('is_vegetarian') === 'true';
  const spicy_level      = parseInt(formData.get('spicy_level') as string) || 0;
  const cooking_notesRaw = (formData.get('cooking_notes') as string | null) ?? '';
  const cooking_notes    = cooking_notesRaw.trim() || null;

  const shabbat_friday   = formData.get('shabbat_friday') === 'true';
  const shabbat_saturday = formData.get('shabbat_saturday') === 'true';
  const shabbat_kashrut  = (formData.get('shabbat_kashrut') as string | null) ?? 'רגיל';

  const { error } = await admin
    .from('beneficiaries')
    .update({
      is_vegetarian,
      spicy_level,
      cooking_notes,
      shabbat_friday,
      shabbat_saturday,
      shabbat_kashrut,
    })
    .eq('user_id', session.user.id);

  if (error) {
    console.error('[updateShabbatPreferences]', error);
    throw new Error('שגיאה בשמירת ההעדפות: ' + error.message);
  }

  revalidatePath('/beneficiary');
  revalidatePath('/beneficiary/preferences');
}

