import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function sendAnnouncement(formData: FormData) {
  'use server';
  const message  = (formData.get('message') as string).trim();
  const audience = formData.get('audience') as string; // all | cook | driver | beneficiary

  if (!message) throw new Error('נא להזין הודעה');

  const admin = adminClient();

  // Get target users
  let query = admin.from('users').select('id').eq('approved', true);
  if (audience !== 'all') query = query.eq('role', audience);
  const { data: users } = await query;

  if (!users || users.length === 0) return;

  // Insert notification for each user
  const rows = users.map((u) => ({
    user_id: u.id,
    message,
    type: 'announcement',
    read: false,
  }));

  await admin.from('notifications_log').insert(rows);

  revalidatePath('/admin/announcements');
  redirect('/admin/announcements?sent=1');
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>הודעות כלליות</h1>
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
            <label className="text-sm font-semibold text-right block" style={{ color: '#811453' }}>לקהל</label>
            <select name="audience" defaultValue="all"
                    className="w-full rounded-xl border border-[#F7D4E2] bg-white px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#811453]">
              <option value="all">כולן</option>
              <option value="cook">מבשלות בלבד</option>
              <option value="driver">מחלקות בלבד</option>
              <option value="beneficiary">יולדות בלבד</option>
            </select>
          </div>
          <div className="px-4 py-4 space-y-2">
            <label className="text-sm font-semibold text-right block" style={{ color: '#811453' }}>תוכן ההודעה</label>
            <textarea name="message" rows={4} required
                      placeholder="כתבי את ההודעה כאן..."
                      className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-zinc-800 text-right focus:outline-none focus:ring-1 focus:ring-[#811453]" />
          </div>
        </div>

        <button type="submit"
                className="w-full min-h-[52px] rounded-2xl text-base font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #811453, #4A0731)' }}>
          📢 שלחי הודעה
        </button>
      </form>

      {/* Info box */}
      <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 text-right">
        <p className="text-sm font-semibold" style={{ color: '#811453' }}>מה קורה אחרי השליחה?</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-600">
          <li>🔔 ההודעה מופיעה בפעמון ההתראות של כל המשתמשות הרלוונטיות</li>
          <li>📱 הן יראו אותה בפעם הבאה שיפתחו את האפליקציה</li>
        </ul>
      </div>
    </div>
  );
}
