'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

interface FeedbackPayload {
  mealId:   string;
  rating:   number;
  message:  string;
  targetId: string | null;
}

export async function submitFeedback({ mealId, rating, message, targetId }: FeedbackPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('לא מחוברת');

  const admin = createAdminClient();

  const { error } = await admin.from('feedbacks').insert({
    meal_id:   mealId,
    author_id: session.user.id,
    target_id: targetId,
    rating,
    message:   message.trim() || null,
    sent_wa:   false,
  });

  if (error) throw new Error('שגיאה בשמירת הפידבק: ' + error.message);

  // Notification in-app pour la bénévole ciblée (si message non vide)
  if (targetId && message.trim()) {
    await admin.from('notifications_log').insert({
      user_id: targetId,
      message: `💛 קיבלת הודעת תודה: "${message.trim().slice(0, 80)}${message.trim().length > 80 ? '...' : ''}"`,
      type:    'feedback',
      channel: 'in_app',
    });
  }
}
