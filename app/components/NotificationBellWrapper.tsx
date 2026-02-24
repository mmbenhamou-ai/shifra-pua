import { createSupabaseServerClient } from '@/lib/supabase-server';
import NotificationBell from './NotificationBell';

export default async function NotificationBellWrapper() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return <NotificationBell userId={session.user.id} />;
}
