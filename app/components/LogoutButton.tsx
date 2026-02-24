'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? 'text-xs font-medium text-[#F7D4E2] active:opacity-70 transition'}
    >
      התנתקות
    </button>
  );
}
