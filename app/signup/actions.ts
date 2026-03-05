'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function registerUser(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const role = formData.get('role') as string;
  const name = (formData.get('name') as string).trim();
  let phone = (formData.get('phone') as string).trim();
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) phone = '+' + digits;
  else if (digits.startsWith('0')) phone = '+972' + digits.slice(1);
  else if (digits) phone = '+972' + digits;

  if (!role || !name || !phone) throw new Error('נא למלא את כל השדות החובה');

  const address = (formData.get('address') as string | null)?.trim() ?? null;
  const neighborhood = (formData.get('neighborhood') as string | null)?.trim() ?? null;
  const email = (formData.get('email') as string | null)?.trim() || null;
  const has_car = formData.get('has_car') === 'true';
  const also_driver = formData.get('also_driver') === 'true';
  const notif_cooking = formData.get('notif_cooking') !== 'false';
  const notif_delivery = formData.get('notif_delivery') !== 'false';

  const admin = createAdminClient();

  const { data: existingByPhone, error: phoneCheckError } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .neq('id', userId)
    .maybeSingle();

  if (phoneCheckError) {
    console.error('[registerUser][phone-check]', phoneCheckError);
    throw new Error('שגיאה בבדיקת מספר הטלפון, נסי שוב מאוחר יותר');
  }
  if (existingByPhone) {
    throw new Error('מספר טלפון זה כבר משויך לחשבון אחר');
  }

  const profileRole = role === 'beneficiary' ? 'yoledet' : role === 'driver' ? 'deliverer' : 'cook';
  const city = (address || neighborhood || '').trim() || 'לא צוין';

  const { error: profileError } = await admin.from('profiles').update({
    display_name: name,
    phone,
    city,
    role: profileRole as 'admin' | 'yoledet' | 'cook' | 'deliverer',
    is_approved: false,
  }).eq('id', userId);

  if (profileError) {
    console.error('[registerUser][profiles]', profileError);
    throw new Error('שגיאה בשמירת הפרטים: ' + profileError.message);
  }

  // Notify admins of new registration
  try {
    const { sendPushToAdmins } = await import('@/lib/push-notifications');
    await sendPushToAdmins(
      'הרשמה חדשה! 📝',
      `משתמשת חדשה בשם ${name} נרשמה לתפקיד ${role === 'beneficiary' ? 'יולדת' : role === 'cook' ? 'מבשלת' : role === 'driver' ? 'מחלקת' : 'מתנדבת'}.`,
      '/admin/registrations'
    );
  } catch (err) {
    console.error('Failed to send admin push:', err);
  }

  redirect('/signup/pending');
}
