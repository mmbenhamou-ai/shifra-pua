import EventItem from '@/components/updates/EventItem';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

type Event = {
  id: string;
  type: string;
  message_he: string;
  created_at: string;
};

async function getRelevantEvents(): Promise<Event[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Phase 6 : utiliser le journal de notifications unifié
  const { data } = await supabase
    .from('notifications_log')
    .select('id, message, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return rows.map((row) => ({
    id: row.id as string,
    type: (row.type as string | null) ?? '',
    message_he: row.message as string,
    created_at: row.created_at as string,
  }));
}

export default async function UpdatesPage() {
  const events = await getRelevantEvents();

  return (
    <div className="min-h-screen bg-[#FFF7FB] px-4 pt-4 pb-20" dir="rtl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-[#91006A]">עדכונים</h1>
        <p className="text-sm text-slate-600 mt-1">
          כאן תראי את כל העדכונים האחרונים לגבי הארוחות שלך.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="text-sm text-slate-500">אין כרגע עדכונים להצגה.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

