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

export async function changeUserRole(userId: string, newRole: string) {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('users').update({ role: newRole }).eq('id', userId);
  if (error) throw new Error('שגיאה בעדכון תפקיד: ' + error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function toggleUserActive(userId: string, currentActive: boolean) {
  await ensureAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('users').update({ approved: !currentActive }).eq('id', userId);
  if (error) throw new Error('שגיאה בעדכון חשבון: ' + error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
