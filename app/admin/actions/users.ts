'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';

export async function changeUserRole(userId: string, newRole: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('users').update({ role: newRole }).eq('id', userId);
  if (error) throw new Error('שגיאה בעדכון תפקיד: ' + error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function toggleUserActive(userId: string, currentActive: boolean) {
  const admin = createAdminClient();
  const { error } = await admin.from('users').update({ approved: !currentActive }).eq('id', userId);
  if (error) throw new Error('שגיאה בעדכון חשבון: ' + error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
