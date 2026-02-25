'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';

export async function updateMealStatus(mealId: string, status: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('meals').update({ status }).eq('id', mealId);
  if (error) throw new Error('שגיאה בעדכון סטטוס: ' + error.message);
  revalidatePath('/admin/meals');
}

export async function assignCook(mealId: string, cookId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ cook_id: cookId || null, status: cookId ? 'cook_assigned' : 'open' })
    .eq('id', mealId);
  if (error) throw new Error('שגיאה בהקצאת מבשלת: ' + error.message);
  revalidatePath('/admin/meals');
}

export async function assignDriver(mealId: string, driverId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('meals')
    .update({ driver_id: driverId || null, status: driverId ? 'driver_assigned' : 'cook_assigned' })
    .eq('id', mealId);
  if (error) throw new Error('שגיאה בהקצאת מחלקת: ' + error.message);
  revalidatePath('/admin/meals');
}

export async function deleteMeal(mealId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('meals').delete().eq('id', mealId);
  if (error) throw new Error('שגיאה במחיקת הארוחה: ' + error.message);
  revalidatePath('/admin/meals');
  redirect('/admin/meals');
}

export async function addMealItem(mealId: string, itemName: string, itemType: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('meal_items').insert({
    meal_id:   mealId,
    item_name: itemName,
    item_type: itemType,
  });
  if (error) throw new Error('שגיאה בהוספת פריט: ' + error.message);
  revalidatePath('/admin/meals');
}

export async function removeMealItem(itemId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('meal_items').delete().eq('id', itemId);
  if (error) throw new Error('שגיאה במחיקת פריט: ' + error.message);
  revalidatePath('/admin/meals');
}

export async function createManualMeal(formData: FormData) {
  const beneficiaryId = formData.get('beneficiary_id') as string;
  const date          = formData.get('date') as string;
  const type          = formData.get('type') as string;
  const menuId        = formData.get('menu_id') as string || null;

  if (!beneficiaryId || !date || !type) throw new Error('נא למלא את כל השדות');

  const admin = createAdminClient();
  const { error } = await admin.from('meals').insert({
    beneficiary_id: beneficiaryId,
    date,
    type,
    menu_id: menuId,
    status: 'open',
  });
  if (error) throw new Error('שגיאה ביצירת הארוחה: ' + error.message);
  revalidatePath('/admin/meals');
  redirect('/admin/meals');
}
