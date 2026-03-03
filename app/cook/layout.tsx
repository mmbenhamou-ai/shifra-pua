import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import LogoutButton from '@/app/components/LogoutButton';
import NotificationBellWrapper from '@/app/components/NotificationBellWrapper';

export default async function CookLayout({ children }: { children: ReactNode }) {
  const { session, user } = await getSessionOrDevBypass();
  if (!session) redirect('/login');
  if (!user) redirect('/signup');
  if (!user.approved) redirect('/signup/pending');
  if (user.role !== 'cook' && user.role !== 'both') redirect('/');

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <header className="w-full px-4 py-3 shadow-md" style={{ backgroundColor: '#91006A' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <LogoutButton />
          <h1 className="text-xl font-bold text-white">שפרה ופועה</h1>
          <div className="flex items-center gap-2">
            <NotificationBellWrapper />
            <a href="/profile" className="text-sm text-[#F7D4E2] transition active:opacity-70">👤</a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        {children}
      </main>
    </div>
  );
}
