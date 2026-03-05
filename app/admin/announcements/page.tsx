import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendGlobalPushNotification } from '@/lib/push-notifications';

async function sendAnnouncement(formData: FormData) {
  'use server';
  const message = (formData.get('message') as string).trim();
  const audience = formData.get('audience') as string; // all | cook | deliverer | yoledet

  if (!message) throw new Error('נא להזין הודעה');

  const admin = createAdminClient();

  let query = admin.from('profiles').select('id').eq('is_approved', true);
  if (audience !== 'all') query = query.eq('role', audience);
  const { data: profiles } = await query;

  if (!profiles || profiles.length === 0) return;

  const rows = profiles.map((u) => ({
    user_id: u.id,
    message,
    type: 'announcement',
    read: false,
  }));

  await admin.from('notifications_log').insert(rows);

  // Send Push Notifications
  try {
    await sendGlobalPushNotification(
      audience,
      'הודעה חדשה מהצוות 📢',
      message,
      '/profile'
    );
  } catch (err) {
    console.error('Failed to send push notifications:', err);
  }

  revalidatePath('/admin/announcements');
  redirect('/admin/announcements?sent=1');
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const admin = createAdminClient();

  // Fetch recent announcements (grouped by message roughly)
  const { data: recentNotifs } = await admin
    .from('notifications_log')
    .select('message, created_at, type')
    .eq('type', 'announcement')
    .order('created_at', { ascending: false })
    .limit(10);

  // Simple deduplication logic for the UI
  const uniqueMessages = new Map<string, string>();
  (recentNotifs as { message: string, created_at: string }[] | null)?.forEach(n => {
    if (!uniqueMessages.has(n.message)) {
      uniqueMessages.set(n.message, n.created_at);
    }
  });
  const history = Array.from(uniqueMessages.entries()).slice(0, 5);

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>הודעות כלליות</h1>
        <p className="text-sm text-zinc-500">שלחי הודעה לכל המתנדבות</p>
      </header>

      {sent && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-sm font-semibold text-emerald-700">✓ ההודעה נשלחה בהצלחה!</p>
        </div>
      )}

      <form action={sendAnnouncement} className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm divide-y divide-[#FBE4F0]">
          <div className="px-4 py-4 space-y-2">
            <label className="text-sm font-semibold text-right block" style={{ color: 'var(--brand)' }}>לקהל</label>
            <select name="audience" defaultValue="all"
              className="w-full rounded-xl border border-[#F7D4E2] bg-white px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]">
              <option value="all">כולן</option>
              <option value="cook">מבשלות בלבד</option>
              <option value="deliverer">מחלקות בלבד</option>
              <option value="yoledet">יולדות בלבד</option>
            </select>
          </div>
          <div className="px-4 py-4 space-y-2">
            <label className="text-sm font-semibold text-right block" style={{ color: 'var(--brand)' }}>תוכן ההודעה</label>
            <textarea name="message" rows={4} required
              placeholder="כתבי את ההודעה כאן..."
              className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-zinc-800 text-right focus:outline-none focus:ring-1 focus:ring-[var(--brand)]" />
          </div>
        </div>

        <button type="submit"
          className="w-full min-h-[52px] rounded-2xl text-base font-bold text-white transition-opacity active:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--brand), #4A0731)' }}>
          📢 שלחי הודעה
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-right" style={{ color: 'var(--brand)' }}>הודעות אחרונות שנשלחו</h2>
          <div className="space-y-2">
            {history.map(([msg, date], i) => (
              <div key={i} className="rounded-2xl border border-[#FBE4F0] bg-white px-4 py-3 text-right">
                <p className="text-xs text-zinc-400 mb-1">
                  {new Date(date).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-zinc-800 leading-relaxed font-medium">{msg}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info box */}
      <div className="rounded-2xl border border-[#F7D4E2] bg-white/50 px-4 py-4 text-right">
        <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>מה קורה אחרי השליחה?</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-600">
          <li>🔔 ההודעה מופיעה בפעמון ההתראות של כל המשתמשות הרלוונטיות</li>
          <li>📱 הן יראו אותה בפעם הבאה שיפתחו את האפליקציה</li>
        </ul>
      </div>
    </div>
  );
}
