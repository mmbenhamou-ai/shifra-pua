'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function releaseMealAsCook(mealId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('cook_release_meal', {
    p_meal_id: mealId,
  });

  if (error) {
    if (error.message.includes('ERR_CONFLICT')) {
      throw new Error('לא ניתן להחזיר את הארוחה (סטטוס לא תקין או לא שלך)');
    }
    throw new Error('שגיאה בהחזרת הארוחה: ' + error.message);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('לא ניתן להחזיר את הארוחה (סטטוס לא תקין)');
  }

  revalidatePath('/cook');
}

export async function releaseMealAsDriver(mealId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('driver_release_meal', {
    p_meal_id: mealId,
  });

  if (error) {
    if (error.message.includes('ERR_CONFLICT')) {
      throw new Error('לא ניתן להחזיר את המשלוח (סטטוס לא תקין או לא שלך)');
    }
    throw new Error('שגיאה בהחזרת המשלוח: ' + error.message);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('לא ניתן להחזיר את המשלוח (סטטוס לא תקין)');
  }

  revalidatePath('/driver');
}
