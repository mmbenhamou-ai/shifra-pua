import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Redirige selon le rôle
  const { data: user } = await supabase
    .from('users')
    .select('role, approved')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!user) redirect('/signup');
  if (!user.approved) redirect('/signup/pending');

  switch (user.role) {
    case 'admin':      redirect('/admin');
    case 'beneficiary': redirect('/beneficiary');
    case 'cook':       redirect('/cook');
    case 'driver':     redirect('/driver');
    default:           redirect('/login');
  }
}
