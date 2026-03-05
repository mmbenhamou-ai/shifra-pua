import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';

export default async function YoledetDashboardPage() {
  const { session, user } = await getSessionOrDevBypass();
  if (!session) redirect('/login');
  if (!user) redirect('/signup');

  // Phase 6 : tableau de bord יולדת unifié sous /beneficiary
  redirect('/beneficiary');
}

