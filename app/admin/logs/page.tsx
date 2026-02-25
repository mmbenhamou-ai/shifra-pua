import { createAdminClient } from '@/lib/supabase-admin';

const ACTION_ICONS: Record<string, string> = {
  meal_taken:           '🍲',
  meal_ready:           '✅',
  meal_delivered:       '🚗',
  meal_confirmed:       '👶',
  user_approved:        '✔️',
  user_rejected:        '❌',
  meal_created:         '➕',
  meal_deleted:         '🗑️',
  status_changed:       '🔄',
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = '1' } = await searchParams;
  const pageNum = parseInt(page) || 1;
  const perPage = 30;
  const offset  = (pageNum - 1) * perPage;

  const admin = createAdminClient();

  // Essayer de lire depuis notifications_log comme audit trail
  const { data: logs, count } = await admin
    .from('notifications_log')
    .select('id, message, type, created_at, user_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const total = count ?? 0;
  const pages = Math.ceil(total / perPage);

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>יומן פעולות</h1>
        <p className="text-sm text-zinc-500">{total} רשומות</p>
      </header>

      {(!logs || logs.length === 0) ? (
        <div className="rounded-2xl border border-[#F7D4E2] bg-white py-10 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-zinc-400">אין פעולות ביומן עדיין</p>
          <p className="text-xs text-zinc-300 mt-1">הפעולות יתועדו כאן אוטומטית</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#FBE4F0] overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white">
          {logs.map((log) => {
            const icon = ACTION_ICONS[(log.type as string) ?? ''] ?? '📢';
            return (
              <li key={log.id as string} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 text-xl">{icon}</span>
                <div className="flex-1 text-right">
                  <p className="text-sm text-zinc-800">{log.message as string}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(log.created_at as string).toLocaleString('he-IL')}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`/admin/logs?page=${p}`}
               className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition"
               style={{ backgroundColor: p === pageNum ? '#811453' : '#FBE4F0',
                        color:           p === pageNum ? '#fff' : '#811453' }}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
