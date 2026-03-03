import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';

export default async function Home() {
  const { session, user } = await getSessionOrDevBypass();
  if (!session) redirect('/login');
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
