'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

async function ensureAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('נא להתחבר שוב');

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (user?.role !== 'admin') {
    throw new Error('פעולה זו שמורה למנהלות המערכת בלבד');
  }
  return session;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['cook_assigned'],
  cook_assigned: ['ready', 'open'],
  ready: ['driver_assigned', 'cook_assigned'],
  driver_assigned: ['picked_up', 'ready'],
  picked_up: ['delivered', 'driver_assigned'],
  delivered: ['confirmed', 'picked_up'],
  confirmed: ['delivered'], // Allow undoing confirmation if needed
};

export async function updateMealStatus(mealId: string, newStatus: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  // Get current status
  const { data: meal } = await admin.from('meals').select('status').eq('id', mealId).single();
  if (!meal) throw new Error('הארוחה לא נמצאה');

  const currentStatus = meal.status as string;
  if (currentStatus !== newStatus && !VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    throw new Error(`מעבר סטטוס לא תקין: ${currentStatus} ← ${newStatus}`);
  }

  const { error } = await admin.from('meals').update({ status: newStatus }).eq('id', mealId);
  if (error) throw new Error('שגיאה בעדכון סטטוס: ' + error.message);

  // לוג ביקורת
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'update_meal_status',
    target_id: mealId,
    details: { from: currentStatus, to: newStatus }
  });

  revalidatePath('/admin/meals');
}

export async function assignCook(mealId: string, cookId: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  const { data: meal } = await admin.from('meals').select('status').eq('id', mealId).single();
  if (!meal) throw new Error('הארוחה לא נמצאה');

  const currentStatus = meal.status as string;
  let nextStatus = currentStatus;

  if (cookId) {
    // Assigning a cook: only valid from 'open'
    if (currentStatus !== 'open') {
      throw new Error(`לא ניתן להקצות מבשלת כשהסטטוס הוא ${currentStatus}`);
    }
    nextStatus = 'cook_assigned';
  } else {
    // Removing a cook: only valid from 'cook_assigned'
    if (currentStatus !== 'cook_assigned') {
      throw new Error(`לא ניתן להסיר מבשלת כשהסטטוס הוא ${currentStatus}`);
    }
    nextStatus = 'open';
  }

  const { error } = await admin
    .from('meals')
    .update({
      cook_id: cookId || null,
      status: nextStatus
    })
    .eq('id', mealId);

  if (error) throw new Error('שגיאה בהקצאת מבשלת: ' + error.message);

  // לוג ביקורת
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'assign_cook',
    target_id: mealId,
    details: { cook_id: cookId, status: nextStatus }
  });

  revalidatePath('/admin/meals');
}

export async function assignDriver(mealId: string, driverId: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  const { data: meal } = await admin.from('meals').select('status').eq('id', mealId).single();
  if (!meal) throw new Error('הארוחה לא נמצאה');

  const currentStatus = meal.status as string;
  let nextStatus = currentStatus;

  if (driverId) {
    // Assigning a driver: only valid from 'ready'
    if (currentStatus !== 'ready') {
      throw new Error(`לא ניתן להקצות מחלקת כשהסטטוס הוא ${currentStatus}`);
    }
    nextStatus = 'driver_assigned';
  } else {
    // Removing a driver: only valid from 'driver_assigned'
    if (currentStatus !== 'driver_assigned') {
      throw new Error(`לא ניתן להסיר מחלקת כשהסטטוס הוא ${currentStatus}`);
    }
    nextStatus = 'ready';
  }

  const { error } = await admin
    .from('meals')
    .update({
      driver_id: driverId || null,
      status: nextStatus
    })
    .eq('id', mealId);

  if (error) throw new Error('שגיאה בהקצאת מחלקת: ' + error.message);

  // לוג ביקורת
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'assign_driver',
    target_id: mealId,
    details: { driver_id: driverId, status: nextStatus }
  });

  revalidatePath('/admin/meals');
}

export async function deleteMeal(mealId: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  // לוג ביקורת (לפני מחיקה)
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'delete_meal',
    target_id: mealId
  });

  const { error } = await admin.from('meals').delete().eq('id', mealId);
  if (error) throw new Error('שגיאה במחיקת הארוחה: ' + error.message);
  revalidatePath('/admin/meals');
  redirect('/admin/meals');
}

export async function addMealItem(mealId: string, itemName: string, itemType: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('meal_items').insert({
    meal_id: mealId,
    item_name: itemName,
    item_type: itemType,
  });
  if (error) throw new Error('שגיאה בהוספת פריט: ' + error.message);

  // לוג ביקורת
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'add_meal_item',
    target_id: mealId,
    details: { item_name: itemName, item_type: itemType }
  });

  revalidatePath('/admin/meals');
}

export async function removeMealItem(itemId: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  // לוג ביקורת (לפני מחיקה)
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'remove_meal_item',
    target_id: itemId
  });

  const { error } = await admin.from('meal_items').delete().eq('id', itemId);
  if (error) throw new Error('שגיאה במחיקת פריט: ' + error.message);
  revalidatePath('/admin/meals');
}

export async function createManualMeal(formData: FormData) {
  const session = await ensureAdmin();
  const beneficiaryId = formData.get('beneficiary_id') as string;
  const date = formData.get('date') as string;
  const type = formData.get('type') as string;
  const menuId = formData.get('menu_id') as string || null;

  if (!beneficiaryId || !date || !type) throw new Error('נא למלא את כל השדות');

  const admin = createAdminClient();
  const { data, error } = await admin.from('meals').insert({
    beneficiary_id: beneficiaryId,
    date,
    type,
    menu_id: menuId,
    status: 'open',
  }).select('id').single();

  if (error) throw new Error('שגיאה ביצירת הארוחה: ' + error.message);

  // לוג ביקורת
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'create_manual_meal',
    target_id: data?.id,
    details: { beneficiary_id: beneficiaryId, date, type }
  });

  revalidatePath('/admin/meals');
  redirect('/admin/meals');
}
