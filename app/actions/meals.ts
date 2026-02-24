'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// יולדת מאשרת קבלה
export async function confirmMealReceived(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'confirmed' })
    .eq('id', mealId);
  if (error) throw new Error('שגיאה באישור קבלה: ' + error.message);
  revalidatePath('/beneficiary');
}

// מבשלת לוקחת ארוחה פנויה
export async function takeMeal(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'cook_assigned', cook_id: session.user.id })
    .eq('id', mealId)
    .eq('status', 'open');
  if (error) throw new Error('שגיאה בלקיחת הארוחה: ' + error.message);
  revalidatePath('/cook');
}

// מבשלת מדווחת שהאוכל מוכן לאיסוף
export async function markMealReady(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'ready' })
    .eq('id', mealId)
    .eq('cook_id', session.user.id);
  if (error) throw new Error('שגיאה בעדכון סטטוס: ' + error.message);
  revalidatePath('/cook');
}

// מחלקת לוקחת משלוח
export async function takeDelivery(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'driver_assigned', driver_id: session.user.id })
    .eq('id', mealId)
    .in('status', ['cook_assigned', 'ready']);
  if (error) throw new Error('שגיאה בלקיחת המשלוח: ' + error.message);
  revalidatePath('/driver');
}

// מחלקת מאשרת איסוף
export async function markPickedUp(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'picked_up' })
    .eq('id', mealId)
    .eq('driver_id', session.user.id);
  if (error) throw new Error('שגיאה באישור האיסוף: ' + error.message);
  revalidatePath('/driver');
}

// מחלקת מאשרת מסירה
export async function markDelivered(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ status: 'delivered' })
    .eq('id', mealId)
    .eq('driver_id', session.user.id);
  if (error) throw new Error('שגיאה באישור המסירה: ' + error.message);
  revalidatePath('/driver');
  revalidatePath('/beneficiary');
}
