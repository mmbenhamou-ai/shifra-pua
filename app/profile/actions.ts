'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const name         = (formData.get('name') as string).trim();
  const phone        = (formData.get('phone') as string).trim();
  const address      = (formData.get('address') as string | null)?.trim() || null;
  const neighborhood = (formData.get('neighborhood') as string | null)?.trim() || null;

  if (!name || !phone) throw new Error('שם וטלפון הם שדות חובה');

  const admin = adminClient();
  const { error } = await admin
    .from('users')
    .update({ name, phone, address, neighborhood })
    .eq('id', session.user.id);

  if (error) throw new Error('שגיאה בשמירת הפרטים: ' + error.message);

  revalidatePath('/profile');
}
