'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function createMenu(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const type = formData.get('type') as string;
  const itemsRaw = (formData.get('items') as string).trim();
  const items = itemsRaw
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean);

  if (!name || !type || items.length === 0) {
    throw new Error('נא למלא את כל השדות');
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('menus')
    .insert({ name, type, items, active: true });

  if (error) {
    console.error('[createMenu]', error);
    throw new Error(`שגיאה ביצירת התפריט: ${error.message}`);
  }

  revalidatePath('/admin/menus');
}

export async function toggleMenuActive(menuId: string, currentActive: boolean) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('menus')
    .update({ active: !currentActive })
    .eq('id', menuId);

  if (error) {
    console.error('[toggleMenuActive]', error);
    throw new Error(`שגיאה בעדכון התפריט: ${error.message}`);
  }

  revalidatePath('/admin/menus');
}

export async function deleteMenu(menuId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('menus').delete().eq('id', menuId);

  if (error) {
    console.error('[deleteMenu]', error);
    throw new Error(`שגיאה במחיקת התפריט: ${error.message}`);
  }

  revalidatePath('/admin/menus');
}
