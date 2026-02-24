import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import LogoutButton from '@/app/components/LogoutButton';

export default async function CookLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: user } = await supabase
    .from('users')
    .select('role, approved')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!user) redirect('/signup');
  if (!user.approved) redirect('/signup/pending');
  if (user.role !== 'cook') redirect('/');

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <header className="w-full px-4 py-3 shadow-md" style={{ backgroundColor: '#811453' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <LogoutButton />
          <h1 className="text-xl font-bold text-white">שפרה פועה</h1>
          <a href="/profile" className="text-sm text-[#F7D4E2] transition active:opacity-70">👤</a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        {children}
      </main>
    </div>
  );
}
