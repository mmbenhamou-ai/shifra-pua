import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, UserPlus, UtensilsCrossed, CalendarDays,
  ClipboardList, BarChart3, Users, Settings, Megaphone,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import LogoutButton from '@/app/components/LogoutButton';
import NotificationBellWrapper from '@/app/components/NotificationBellWrapper';

const NAV_ITEMS = [
  { href: '/admin',               label: 'בקרה',     Icon: LayoutDashboard },
  { href: '/admin/registrations', label: 'הרשמות',   Icon: UserPlus },
  { href: '/admin/meals',         label: 'ארוחות',   Icon: ClipboardList },
  { href: '/admin/menus',         label: 'תפריטים',  Icon: UtensilsCrossed },
  { href: '/admin/users',         label: 'משתמשות',  Icon: Users },
  { href: '/admin/stats',         label: 'סטטיסטיקה',Icon: BarChart3 },
  { href: '/admin/calendar',      label: 'לוח',      Icon: CalendarDays },
  { href: '/admin/announcements', label: 'הודעות',   Icon: Megaphone },
  { href: '/admin/settings',      label: 'הגדרות',   Icon: Settings },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: user } = await supabase
    .from('users').select('role').eq('id', session.user.id).maybeSingle();
  if (user?.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen bg-[#FFF7FB] text-[#2D0A1F] flex flex-col" dir="rtl">
      <header className="w-full shadow-md" style={{ backgroundColor: '#811453' }}>
        <div className="mx-auto flex max-w-md flex-col gap-1.5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NotificationBellWrapper />
              <LogoutButton />
            </div>
            <div className="text-xl font-bold tracking-tight text-white">שפרה פועה</div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 px-4 pb-24 pt-4">
        <div className="w-full">{children}</div>
      </main>

      {/* Bottom nav — scrollable */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-[#E9BFD4] bg-white/95 backdrop-blur z-40">
        <div className="flex overflow-x-auto gap-0.5 px-1 py-1.5 no-scrollbar">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-shrink-0 px-2 py-1 rounded-xl text-[9px] font-medium text-[#811453] active:bg-[#FBE4F0] transition min-w-[52px]"
            >
              <span className="mb-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#F7D4E2]">
                <item.Icon size={13} strokeWidth={2} color="#811453" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
