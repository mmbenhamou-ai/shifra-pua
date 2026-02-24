'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function releaseMealAsCook(mealId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'open', cook_id: null })
    .eq('id', mealId)
    .eq('cook_id', session.user.id)
    .eq('status', 'cook_assigned'); // Only release if not already ready

  if (error) throw new Error('שגיאה בהחזרת הארוחה: ' + error.message);
  revalidatePath('/cook');
}

export async function releaseMealAsDriver(mealId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'ready', driver_id: null })
    .eq('id', mealId)
    .eq('driver_id', session.user.id)
    .eq('status', 'driver_assigned');

  if (error) throw new Error('שגיאה בהחזרת המשלוח: ' + error.message);
  revalidatePath('/driver');
}
