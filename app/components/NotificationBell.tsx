'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Notif {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  type?: string;
}

const TYPE_ICONS: Record<string, string> = {
  meal_taken: '🍲',
  meal_ready: '✅',
  meal_delivered: '🚗',
  meal_confirmed: '👶',
  new_registration: '📝',
  registration_approved: '✔️',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שע׳`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Stable client — never recreated
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications_log')
      .select('id, message, created_at, read, type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifs(data as Notif[]);
      setUnread((data as Notif[]).filter((n) => !n.read).length);
    }
  }, [supabase, userId]);

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications_log')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    setUnread(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [supabase, userId]);

  // Initial load + realtime
  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(console.error);
    }, 0);
    const channel = supabase
      .channel('notifs-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications_log', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifs((prev) => [payload.new as Notif, ...prev.slice(0, 19)]);
          setUnread((u) => u + 1);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, load]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      markAllRead();
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition active:scale-95"
        aria-label="התראות"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#FBE4F0] px-4 py-2.5">
            <button onClick={markAllRead} className="text-[11px] text-[var(--brand)] underline">
              סמן הכל כנקרא
            </button>
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>התראות</p>
          </div>
          <ul className="max-h-80 divide-y divide-[#FBE4F0] overflow-y-auto">
            {notifs.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-400">אין התראות</li>
            ) : notifs.map((n) => {
              const icon = TYPE_ICONS[n.type ?? ''] ?? '📢';
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-2 px-4 py-2.5 text-right transition ${n.read ? 'opacity-60' : 'bg-[#FFF7FB]'}`}
                >
                  <span className="mt-0.5 text-base">{icon}</span>
                  <div className="flex-1">
                    <p className="text-xs leading-snug text-zinc-800">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">{timeAgo(n.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
