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

/** מחזיר את כל ימי שישי ושבת בתוך טווח נתון */
function shabbatDatesInRange(start: Date, weeks: number): { friday: Date; saturday: Date }[] {
  const result: { friday: Date; saturday: Date }[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const dayOfWeek = cursor.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 6;
  cursor.setDate(cursor.getDate() + daysUntilFriday);

  for (let i = 0; i < weeks; i++) {
    const friday = new Date(cursor);
    const saturday = new Date(cursor);
    saturday.setDate(saturday.getDate() + 1);
    result.push({ friday, saturday });
    cursor.setDate(cursor.getDate() + 7);
  }
  return result;
}

/** פורמט תאריך ל-YYYY-MM-DD */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function approveUser(userId: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  // 1. אשר את המשתמשת
  const { error: approveError } = await admin
    .from('users')
    .update({ approved: true })
    .eq('id', userId);

  if (approveError) {
    console.error('[approveUser] approve:', approveError);
    throw new Error('שגיאה באישור המשתמשת');
  }

  // 2. שלוף את נתוני המשתמשת
  const { data: user } = await admin
    .from('users')
    .select('role, also_driver, name')
    .eq('id', userId)
    .single();

  // אם היא מבשלת ויש לה גם רכב (also_driver), הפוך אותה ל-both
  if (user?.also_driver && user?.role === 'cook') {
    await admin.from('users').update({ role: 'both' }).eq('id', userId);
  }

  // 3. לוג ביקורת
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'approve_user',
    target_id: userId,
    details: { name: user?.name, role: user?.role }
  });

  // 4. Send Push Notification to the user
  try {
    const { sendPushNotification } = await import('@/lib/push-notifications');
    await sendPushNotification(
      userId,
      'החשבון שלך אושר! 🎊',
      'ברוכה הבאה לשפרה ופועה. עכשיו את יכולה לגשת לכל הפיצ\'רים של האפליקציה.',
      '/'
    );
  } catch (err) {
    console.error('Failed to send approval push:', err);
  }

  if (user?.role !== 'beneficiary') {
    revalidatePath('/admin');
    revalidatePath('/admin/registrations');
    return;
  }

  // 3. שלוף את נתוני ה-beneficiary — או צור אותו אם חסר
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: existingBen } = await admin
    .from('beneficiaries')
    .select('id, start_date, num_breakfast_days, num_shabbat_weeks, shabbat_friday, shabbat_saturday')
    .eq('user_id', userId)
    .maybeSingle();

  let ben = existingBen;

  if (!ben) {
    console.warn('[approveUser] beneficiary record missing — creating it now for user', userId);
    const { data: newBen, error: benCreateError } = await admin
      .from('beneficiaries')
      .insert({
        user_id: userId,
        start_date: todayStr,
        num_breakfast_days: 14,
        num_shabbat_weeks: 2,
        shabbat_friday: true,
        shabbat_saturday: true,
        active: true,
      })
      .select('id, start_date, num_breakfast_days, num_shabbat_weeks, shabbat_friday, shabbat_saturday')
      .single();

    if (benCreateError || !newBen) {
      console.error('[approveUser] failed to create beneficiary record:', benCreateError);
      revalidatePath('/admin', 'layout');
      redirect('/admin/registrations');
    }

    ben = newBen;
  }

  // Si start_date est NULL, on le fixe à aujourd'hui et on le persiste en base
  const startDateStr = (ben.start_date as string | null) ?? todayStr;

  if (!ben.start_date) {
    await admin
      .from('beneficiaries')
      .update({ start_date: todayStr })
      .eq('id', ben.id);
  }

  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  const numBreakfast = (ben.num_breakfast_days as number) ?? 14;
  const numShabbat = (ben.num_shabbat_weeks as number) ?? 2;

  // 4. שלוף תפריטים פעילים לפי סוג
  const { data: menus } = await admin
    .from('menus')
    .select('id, type')
    .eq('active', true);

  const menuByType: Record<string, string> = {};
  for (const m of menus ?? []) {
    menuByType[m.type as string] = m.id as string;
  }

  // Vérification : menus requis présents ?
  const missingMenus: string[] = [];
  if (ben.num_breakfast_days > 0 && !menuByType['breakfast'])
    missingMenus.push('ארוחת בוקר');
  if (ben.shabbat_friday && !menuByType['shabbat_friday'])
    missingMenus.push('שבת (שישי)');
  if (ben.shabbat_saturday && !menuByType['shabbat_saturday'])
    missingMenus.push('שבת (שבת)');

  if (missingMenus.length > 0) {
    return {
      error: `חסרים תפריטים פעילים עבור: ${missingMenus.join(', ')}. אנא צרי תפריטים קודם.`
    };
  }

  const mealsToInsert: {
    beneficiary_id: string;
    menu_id: string;
    date: string;
    type: string;
    status: string;
  }[] = [];

  // 5. ארוחות בוקר יומיות
  if (menuByType['breakfast']) {
    for (let i = 0; i < numBreakfast; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      mealsToInsert.push({
        beneficiary_id: ben.id as string,
        menu_id: menuByType['breakfast'],
        date: toDateStr(d),
        type: 'breakfast',
        status: 'open',
      });
    }
  }

  // 6. ארוחות שבת
  const shabbats = shabbatDatesInRange(startDate, numShabbat);
  for (const { friday, saturday } of shabbats) {
    if (menuByType['shabbat_friday']) {
      mealsToInsert.push({
        beneficiary_id: ben.id as string,
        menu_id: menuByType['shabbat_friday'],
        date: toDateStr(friday),
        type: 'shabbat_friday',
        status: 'open',
      });
    }
    if (menuByType['shabbat_saturday']) {
      mealsToInsert.push({
        beneficiary_id: ben.id as string,
        menu_id: menuByType['shabbat_saturday'],
        date: toDateStr(saturday),
        type: 'shabbat_saturday',
        status: 'open',
      });
    }
  }

  // 7. הכנס את כל הארוחות
  if (mealsToInsert.length > 0) {
    const { error: insertError } = await admin.from('meals').insert(mealsToInsert);
    if (insertError) {
      console.error('[approveUser] meals insert:', insertError);
      // לא זורקים שגיאה — האישור עצמו הצליח
    } else {
      console.log(`[approveUser] created ${mealsToInsert.length} meals for beneficiary ${ben.id}`);
    }
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin/registrations');
}

export async function rejectUser(userId: string) {
  const session = await ensureAdmin();
  const admin = createAdminClient();

  // לוג ביקורת (לפני המחיקה)
  await admin.from('admin_audit_log').insert({
    admin_id: session.user.id,
    action: 'reject_user',
    target_id: userId,
  });

  // Supprime aussi le compte Auth pour empêcher une reconnexion OTP avec le même numéro
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('[rejectUser][auth]', authError);
  }

  const { error } = await admin
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('[rejectUser]', error);
    throw new Error('שגיאה בדחיית המשתמשת');
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin/registrations');
}
