'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitFeedback } from './actions';

const SMILEYS = [
  { value: 1, emoji: '😞', label: 'מאכזב' },
  { value: 2, emoji: '😐', label: 'בסדר' },
  { value: 3, emoji: '🙂', label: 'טוב' },
  { value: 4, emoji: '😊', label: 'מצוין' },
  { value: 5, emoji: '🤩', label: 'מדהים!' },
];

interface Props {
  mealId:  string;
  cook:    { id: string; name: string } | null;
  driver:  { id: string; name: string } | null;
}

export default function FeedbackForm({ mealId, cook, driver }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  const [rating,   setRating]   = useState<number | null>(null);
  const [message,  setMessage]  = useState('');
  // '__all__' = לכולן יחד (null en DB), string = id de la bénévole ciblée
  const [targetKey, setTargetKey] = useState<string>('__all__');
  const [error,    setError]    = useState<string | null>(null);

  const targetId = targetKey === '__all__' ? null : targetKey;

  const targets = [
    cook   && { id: cook.id,   name: `${cook.name} (מבשלת)`   },
    driver && { id: driver.id, name: `${driver.name} (מחלקת)` },
  ].filter(Boolean) as { id: string; name: string }[];

  async function handleSubmit() {
    if (!rating) { setError('נא לבחור דירוג'); return; }
    setError(null);
    start(async () => {
      try {
        await submitFeedback({ mealId, rating, message, targetId });
        router.push('/beneficiary?feedback=sent');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה בשליחה');
      }
    });
  }

  return (
    <div className="space-y-6">

      {/* Rating smileys */}
      <div className="rounded-2xl bg-white border border-[#F7D4E2] p-5 space-y-3 text-right shadow-sm">
        <p className="text-sm font-bold text-zinc-800">איך היה? *</p>
        <div className="flex justify-between">
          {SMILEYS.map((s) => (
            <button key={s.value} type="button"
              onClick={() => setRating(s.value)}
              className="flex flex-col items-center gap-1 transition-transform"
              style={{ transform: rating === s.value ? 'scale(1.25)' : 'scale(1)' }}>
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-[10px] font-medium"
                    style={{ color: rating === s.value ? 'var(--brand)' : '#9CA3AF' }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="rounded-2xl bg-white border border-[#F7D4E2] p-5 space-y-3 shadow-sm">
        <p className="text-sm font-bold text-zinc-800 text-right">הודעת תודה (אופציונלי)</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="תודה רבה על הטעם המדהים! ..."
          rows={4}
          className="w-full rounded-xl border border-[#F7D4E2] px-3 py-2.5 text-sm text-right text-zinc-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
        />
      </div>

      {/* Destinataire */}
      {targets.length > 0 && (
        <div className="rounded-2xl bg-white border border-[#F7D4E2] p-5 space-y-3 shadow-sm">
          <p className="text-sm font-bold text-zinc-800 text-right">למי לשלוח את ההודעה?</p>
          <div className="space-y-2">
            {targets.map((t) => (
              <button key={t.id} type="button"
                onClick={() => setTargetKey(t.id)}
                className="flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition text-right"
                style={{
                  borderColor:     targetKey === t.id ? 'var(--brand)' : '#F7D4E2',
                  backgroundColor: targetKey === t.id ? '#FFF7FB' : '#fff',
                }}>
                <span className="text-base">{targetKey === t.id ? '✓' : '○'}</span>
                <span className="text-sm font-medium text-zinc-900">{t.name}</span>
              </button>
            ))}
            <button type="button"
              onClick={() => setTargetKey('__all__')}
              className="flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition text-right"
              style={{
                borderColor:     targetKey === '__all__' ? 'var(--brand)' : '#F7D4E2',
                backgroundColor: targetKey === '__all__' ? '#FFF7FB' : '#fff',
              }}>
              <span className="text-base">{targetKey === '__all__' ? '✓' : '○'}</span>
              <span className="text-sm font-medium text-zinc-900">לכולן יחד</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 text-right">{error}</p>
      )}

      <button type="button" onClick={handleSubmit} disabled={isPending || !rating}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,var(--brand),#a0185f)', boxShadow: '0 4px 18px rgba(129,20,83,0.30)' }}>
        {isPending
          ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> שולחת...</>
          : <>💛 שליחת תודה</>}
      </button>

      <button type="button" onClick={() => router.push('/beneficiary')}
        className="w-full text-center text-sm underline" style={{ color: '#7C365F' }}>
        דלגי על זה
      </button>
    </div>
  );
}
