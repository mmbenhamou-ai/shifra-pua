'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function changeUserRole(userId: string, newRole: string) {
  const admin = adminClient();
  const { error } = await admin.from('users').update({ role: newRole }).eq('id', userId);
  if (error) throw new Error('שגיאה בעדכון תפקיד: ' + error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function toggleUserActive(userId: string, currentActive: boolean) {
  const admin = adminClient();
  const { error } = await admin.from('users').update({ approved: !currentActive }).eq('id', userId);
  if (error) throw new Error('שגיאה בעדכון חשבון: ' + error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
