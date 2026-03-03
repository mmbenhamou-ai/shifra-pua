'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── יולדת מאשרת קבלה ────────────────────────────────────────────────────────
export async function confirmMealReceived(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();

  // Ensure this user is the beneficiary for the meal
  const { data: meal, error: mealErr } = await admin
    .from('meals')
    .select('beneficiary_id')
    .eq('id', mealId)
    .single();

  if (mealErr || !meal) throw new Error('הארוחה לא נמצאה');

  const { data: ben, error: benErr } = await admin
    .from('beneficiaries')
    .select('user_id')
    .eq('id', meal.beneficiary_id)
    .single();

  if (benErr || !ben || ben.user_id !== session.user.id) {
    throw new Error('פעולה לא מורשית: ארוחה זו אינה שייכת לך');
  }

  const { error } = await admin
    .from('meals')
    .update({ status: 'confirmed' })
    .eq('id', mealId)
    .eq('status', 'delivered');

  if (error) throw new Error('שגיאה באישור קבלה: ' + error.message);
  revalidatePath('/beneficiary');
}

// ─── מבשלת לוקחת ארוחה — atomique via RPC ────────────────────────────────────
export async function takeMeal(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();

  // Appel de la fonction SQL atomique (UPDATE WHERE status=open AND cook_id IS NULL)
  const { data, error } = await admin.rpc('take_meal_atomic', {
    p_meal_id: mealId,
    p_user_id: session.user.id,
    p_role: 'cook',
  });

  if (error) throw new Error('שגיאה בלקיחת הארוחה: ' + error.message);

  // Si aucune ligne retournée → quelqu'un d'autre a pris le repas en même temps
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('מישהו אחרת לקחה את הארוחה הזו עכשיו 😔 בחרי ארוחה אחרת');
  }

  revalidatePath('/cook');
}

// ─── מבשלת מדווחת שהאוכל מוכן ───────────────────────────────────────────────
export async function markMealReady(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const { error } = await createAdminClient()
    .from('meals')
    .update({ status: 'ready' })
    .eq('id', mealId)
    .eq('cook_id', session.user.id)
    .eq('status', 'cook_assigned');

  if (error) throw new Error('שגיאה בעדכון סטטוס: ' + error.message);
  revalidatePath('/cook');
}

// ─── מחלקת לוקחת משלוח — atomique via RPC ────────────────────────────────────
export async function takeDelivery(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();

  const { data, error } = await admin.rpc('take_meal_atomic', {
    p_meal_id: mealId,
    p_user_id: session.user.id,
    p_role: 'driver',
  });

  if (error) throw new Error('שגיאה בלקיחת המשלוח: ' + error.message);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('מישהי אחרת לקחה את המשלוח הזה עכשיו 😔 בחרי משלוח אחר');
  }

  revalidatePath('/driver');
}

// ─── מחלקת מאשרת איסוף ───────────────────────────────────────────────────────
export async function markPickedUp(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const { error } = await createAdminClient()
    .from('meals')
    .update({ status: 'picked_up' })
    .eq('id', mealId)
    .eq('driver_id', session.user.id)
    .eq('status', 'driver_assigned');

  if (error) throw new Error('שגיאה באישור האיסוף: ' + error.message);
  revalidatePath('/driver');
}

// ─── מחלקת מאשרת מסירה ───────────────────────────────────────────────────────
export async function markDelivered(mealId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const { error } = await createAdminClient()
    .from('meals')
    .update({ status: 'delivered' })
    .eq('id', mealId)
    .eq('driver_id', session.user.id)
    .eq('status', 'picked_up');

  if (error) throw new Error('שגיאה באישור המסירה: ' + error.message);
  revalidatePath('/driver');
  revalidatePath('/beneficiary');
}

// ─── מבשלת מזמינה item שבת — atomique ────────────────────────────────────────
export async function reserveMealItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();

  const { data, error } = await admin.rpc('reserve_meal_item_atomic', {
    p_item_id: itemId,
    p_cook_id: session.user.id,
  });

  if (error) throw new Error('שגיאה בהזמנת הפריט: ' + error.message);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('מישהי אחרת הזמינה פריט זה עכשיו 😔 בחרי פריט אחר');
  }

  revalidatePath('/cook');
}

// ─── מבשלת מחזירה item שבת ───────────────────────────────────────────────────
export async function releaseMealItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error('לא מחוברת');

  const { error } = await createAdminClient()
    .from('meal_items')
    .update({ cook_id: null, reserved_at: null })
    .eq('id', itemId)
    .eq('cook_id', session.user.id);

  if (error) throw new Error('שגיאה בהחזרת הפריט: ' + error.message);
  revalidatePath('/cook');
}
