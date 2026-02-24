import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, UserPlus, UtensilsCrossed, Users as UsersIcon } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const NAV_ITEMS = [
  { href: '/admin', label: 'לוח בקרה' },
  { href: '/admin/registrations', label: 'הרשמות' },
  { href: '/admin/menus', label: 'תפריטים' },
  { href: '/admin/users', label: 'משתמשות' },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (user?.role !== 'admin') redirect('/');

  return (
    <div
      className="min-h-screen bg-[#FFF7FB] text-[#2D0A1F] flex flex-col"
      dir="rtl"
    >
      <header
        className="w-full shadow-md"
        style={{ backgroundColor: '#811453' }}
      >
        <div className="mx-auto flex max-w-md flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight text-white">
              שפרה פועה
            </div>
          </div>
          <p className="text-xs text-[#F7D4E2] text-right">
            ממשק ניהול מותאם לנייד – הכל במקום אחד.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 px-4 pb-20 pt-3">
        <div className="w-full">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-[#E9BFD4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch justify-between gap-1 px-2 py-2">
          {NAV_ITEMS.map((item, index) => {
            const Icon =
              index === 0
                ? LayoutDashboard
                : index === 1
                  ? UserPlus
                  : index === 2
                    ? UtensilsCrossed
                    : UsersIcon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-medium text-[#811453] active:bg-[#FBE4F0] transition"
              >
                <span className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#F7D4E2]">
                  <Icon size={18} strokeWidth={2} color="#811453" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


