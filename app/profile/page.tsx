import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: user } = await supabase
    .from('users')
    .select('name, phone, address, neighborhood, role, email')
    .eq('id', session.user.id)
    .single();

  if (!user) redirect('/signup');

  const backHref = user.role === 'admin' ? '/admin'
    : user.role === 'cook'        ? '/cook'
    : user.role === 'driver'      ? '/driver'
    : '/beneficiary';

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <header
        className="w-full px-4 py-3 shadow-md"
        style={{ backgroundColor: '#811453' }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <a href={backHref} className="text-sm text-[#F7D4E2] transition active:opacity-70">
            ← חזרה
          </a>
          <h1 className="text-xl font-bold text-white">שפרה פועה</h1>
          <span className="text-sm text-[#F7D4E2]">👤 פרופיל</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <ProfileForm
          user={{
            name:         user.name  as string,
            phone:        user.phone as string,
            address:      user.address      as string | null,
            neighborhood: user.neighborhood as string | null,
            email:        user.email        as string | null,
            role:         user.role  as string,
          }}
        />
      </main>
    </div>
  );
}
