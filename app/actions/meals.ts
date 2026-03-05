'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';

async function getSupabaseAndSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, session };
}

// ─── יולדת מאשרת קבלה — via RPC sécurisée ────────────────────────────────────
export async function confirmMealReceived(mealId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('confirm_meal_received', {
    p_meal_id: mealId,
  });

  if (error) throw new Error('שגיאה באישור קבלה: ' + error.message);
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('לא ניתן לאשר את הארוחה (סטטוס לא תקין או לא שלך)');
  }
  revalidatePath('/beneficiary');
}

// ─── מבשלת לוקחת ארוחה — RPC atomique sécurisée ─────────────────────────────
export async function takeMeal(mealId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('take_meal_atomic', {
    p_meal_id: mealId,
  });

  if (error) {
    if (error.message.includes('ERR_CONFLICT')) {
      throw new Error('מישהי אחרת לקחה את הארוחה הזו עכשיו 😔 בחרי ארוחה אחרת');
    }
    if (error.message.includes('ERR_NOT_APPROVED')) {
      throw new Error('חשבונך טרם אושר על ידי מנהלת המערכת');
    }
    if (error.message.includes('ERR_FORBIDDEN')) {
      throw new Error('אין לך הרשאה לבצע פעולה זו');
    }
    throw new Error('שגיאה בלקיחת הארוחה: ' + error.message);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('מישהי אחרת לקחה את הארוחה הזו עכשיו 😔 בחרי ארוחה אחרת');
  }

  revalidatePath('/cook');
}

// ─── מבשלת מדווחת שהאוכל מוכן — RPC sécurisée ───────────────────────────────
export async function markMealReady(mealId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('mark_meal_ready', {
    p_meal_id: mealId,
  });

  if (error) throw new Error('שגיאה בעדכון סטטוס: ' + error.message);
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('לא ניתן לסמן כמוכן (הארוחה לא שלך או סטטוס לא תקין)');
  }

  try {
    const { sendGlobalPushNotification } = await import('@/lib/push-notifications');
    await sendGlobalPushNotification(
      'driver',
      'ארוחה מוכנה לאיסוף! 🚗',
      'מבשלת דיווחה שהארוחה מוכנה. מי פנויה לאסוף?',
      '/driver',
    );
  } catch (err) {
    console.error('Failed to send ready push:', err);
  }

  revalidatePath('/cook');
}

// ─── מחלקת לוקחת משלוח — RPC atomique sécurisée ─────────────────────────────
export async function takeDelivery(mealId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('take_meal_atomic', {
    p_meal_id: mealId,
  });

  if (error) {
    if (error.message.includes('ERR_CONFLICT')) {
      throw new Error('מישהי אחרת לקחה את המשלוח הזה עכשיו 😔 בחרי משלוח אחר');
    }
    if (error.message.includes('ERR_FORBIDDEN')) {
      throw new Error('אין לך הרשאה לבצע פעולה זו');
    }
    throw new Error('שגיאה בלקיחת המשלוח: ' + error.message);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('מישהי אחרת לקחה את המשלוח הזה עכשיו 😔 בחרי משלוח אחר');
  }

  revalidatePath('/driver');
}

// ─── מחלקת מאשרת איסוף — RPC sécurisée ─────────────────────────────────────
export async function markPickedUp(mealId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('mark_picked_up', {
    p_meal_id: mealId,
  });

  if (error) throw new Error('שגיאה באישור האיסוף: ' + error.message);
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('לא ניתן לאשר איסוף (סטטוס לא תקין)');
  }
  revalidatePath('/driver');
}

// ─── מחלקת מאשרת מסירה — RPC sécurisée + push ───────────────────────────────
export async function markDelivered(mealId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('mark_delivered', {
    p_meal_id: mealId,
  });

  if (error) throw new Error('שגיאה באישור המסירה: ' + error.message);
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('לא ניתן לאשר מסירה (סטטוס לא תקין)');
  }

  try {
    const mealRow = Array.isArray(data) ? data[0] : data;
    const { data: mealData } = await supabase
      .from('meals')
      .select('beneficiary_id, type')
      .eq('id', mealId)
      .single();

    if (mealData) {
      const { data: benData } = await supabase
        .from('beneficiaries')
        .select('user_id')
        .eq('id', mealData.beneficiary_id)
        .single();

      if (benData) {
        const { sendPushNotification } = await import('@/lib/push-notifications');
        await sendPushNotification(
          benData.user_id as string,
          'הארוחה הגיעה! 🍱',
          `המתנדבת השאירה את ארוחת ${mealData.type === 'breakfast' ? 'הבוקר' : 'שבת'} בפתח הדלת. בתיאבון!`,
          '/beneficiary',
        );
      }
    }
  } catch (err) {
    console.error('Failed to send delivery push:', err);
  }

  revalidatePath('/driver');
  revalidatePath('/beneficiary');
}

// ─── מבשלת מזמינה item שבת — RPC atomique sécurisée ──────────────────────────
export async function reserveMealItem(itemId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { data, error } = await supabase.rpc('reserve_meal_item_atomic', {
    p_item_id: itemId,
  });

  if (error) {
    if (error.message.includes('ERR_CONFLICT')) {
      throw new Error('מישהי אחרת הזמינה פריט זה עכשיו 😔 בחרי פריט אחר');
    }
    throw new Error('שגיאה בהזמנת הפריט: ' + error.message);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('מישהי אחרת הזמינה פריט זה עכשיו 😔 בחרי פריט אחר');
  }

  revalidatePath('/cook');
}

// ─── מבשלת מחזירה item שבת — RPC sécurisée ───────────────────────────────────
export async function releaseMealItem(itemId: string) {
  const { supabase, session } = await getSupabaseAndSession();
  if (!session) throw new Error('לא מחוברת');

  const { error } = await supabase.rpc('release_meal_item', {
    p_item_id: itemId,
  });

  if (error) throw new Error('שגיאה בהחזרת הפריט: ' + error.message);
  revalidatePath('/cook');
}
