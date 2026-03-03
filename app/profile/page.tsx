import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass, DEV_BYPASS_USER_ID } from '@/lib/auth-dev';
import ProfileForm from './ProfileForm';
import LogoutButton from '@/app/components/LogoutButton';
import PushNotificationManager from '@/app/components/PushNotificationManager';

export default async function ProfilePage() {
  const { session, user: sessionUser } = await getSessionOrDevBypass();
  if (!session) redirect('/login');
  if (!sessionUser) redirect('/signup');

  let user: { name: string | null; phone: string | null; address: string | null; neighborhood: string | null; notes: string | null; role: string; email: string | null; notif_cooking: boolean; notif_delivery: boolean } | null;
  if (sessionUser.id === DEV_BYPASS_USER_ID) {
    user = { name: null, phone: null, address: null, neighborhood: null, notes: null, role: sessionUser.role, email: null, notif_cooking: true, notif_delivery: true };
  } else {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('users').select('name, phone, address, neighborhood, notes, role, email, notif_cooking, notif_delivery').eq('id', session.user.id).single();
    user = data;
  }
  if (!user) redirect('/signup');

  const backHref = user.role === 'admin' ? '/admin'
    : user.role === 'cook' ? '/cook'
      : user.role === 'driver' ? '/driver'
        : '/beneficiary';

  const firstName = (user.name as string | null)?.split(' ')[0] ?? '';

  return (
    <div
      className="min-h-screen flex flex-col pb-24 bg-[#f8f5f8]"
      dir="rtl"
      style={{ color: '#403728' }}
    >
      <header className="flex items-center bg-white p-4 border-b border-[#91006A]/10">
        <a href={backHref} className="text-[#91006A] p-2 rounded-full hover:bg-[#91006A]/5">
          <span className="material-symbols-outlined">arrow_forward</span>
        </a>
        <h1 className="text-xl font-bold flex-1 text-center text-[#403728]">פרופיל</h1>
        <Link href={backHref} className="text-[#403728] p-2">
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 space-y-6">
        <section className="flex flex-col items-center py-4 bg-gradient-to-b from-[#91006A]/5 to-transparent rounded-b-2xl">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[#91006A]/10 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-3xl font-bold text-[#91006A]">
                {firstName ? firstName[0] : 'ש'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center mt-4">
            <p className="text-2xl font-bold text-[#403728]">{user.name || 'משתמש/ת'}</p>
            <p className="text-[#91006A]/70 font-medium text-sm">
              {user.email || (user.phone as string) || ''}
            </p>
          </div>
          <a
            href={`${backHref}#edit`}
            className="mt-4 flex min-w-[160px] items-center justify-center rounded-lg h-11 px-6 bg-[#91006A] text-white text-sm font-bold shadow-md hover:bg-[#91006A]/90 transition-colors"
          >
            עריכת פרופיל
          </a>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-[#91006A]/10 px-4 py-5">
          <ProfileForm
            user={{
              name: user.name as string,
              phone: user.phone as string,
              address: user.address as string | null,
              neighborhood: user.neighborhood as string | null,
              notes: user.notes as string | null,
              email: user.email as string | null,
              role: user.role as string,
              notif_cooking: (user.notif_cooking as boolean) ?? true,
              notif_delivery: (user.notif_delivery as boolean) ?? true,
            }}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-3 pb-2 pt-2 border-t border-[#91006A]/10 mt-6">
            <span className="material-symbols-outlined text-[#91006A] text-2xl">device_thermostat</span>
            <h2 className="text-xl font-bold text-[#403728]">נוטיפיקציות דפדפן</h2>
          </div>
          <PushNotificationManager />
        </section>

        <section className="space-y-3 pt-6 border-t border-[#91006A]/10">
          <Link
            href="/help"
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-[#91006A]/10 hover:bg-[#91006A]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#91006A]/10 flex items-center justify-center text-[#91006A]">
                <span className="material-symbols-outlined">help_center</span>
              </div>
              <span className="font-semibold text-[#403728]">מדריך ומרכז עזרה</span>
            </div>
            <span className="material-symbols-outlined text-[#403728]/40">chevron_left</span>
          </Link>

          <Link
            href="/about"
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-[#91006A]/10 hover:bg-[#91006A]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#91006A]/10 flex items-center justify-center text-[#91006A]">
                <span className="material-symbols-outlined">info</span>
              </div>
              <span className="font-semibold text-[#403728]">אודות שפרה ופועה</span>
            </div>
            <span className="material-symbols-outlined text-[#403728]/40">chevron_left</span>
          </Link>
        </section>
        <div className="pt-4">
          <LogoutButton className="w-full flex items-center justify-center gap-2 py-4 bg-[#91006A] text-white font-bold rounded-xl shadow-lg shadow-[#91006A]/20 hover:bg-[#91006A]/90 transition-all" />
        </div>
      </main>
    </div>
  );
}
