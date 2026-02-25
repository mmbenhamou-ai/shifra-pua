'use client';

import { useState, useTransition } from 'react';
import { takeMeal, markMealReady, reserveMealItem, releaseMealItem } from '@/app/actions/meals';
export { useMealRealtime, ConflictBanner } from '@/app/components/RealtimeMealList';

// ─── Spinner helper ───────────────────────────────────────────────────────────
function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

// ─── Conflict / error banner ──────────────────────────────────────────────────
function ConflictMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-right">
      <span className="text-base">⚠️</span>
      <p className="text-xs font-medium text-amber-800">{msg}</p>
    </div>
  );
}

// ─── לוקחת ארוחה ─────────────────────────────────────────────────────────────
export function TakeMealButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError]  = useState<string | null>(null);
  const [taken,  setTaken] = useState(false);

  if (taken) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3">
        <span className="text-sm font-semibold text-emerald-700">✓ לקחת על עצמך!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          start(async () => {
            try {
              await takeMeal(mealId);
              setTaken(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בלקיחת הארוחה');
            }
          });
        }}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#811453,#a0185f)', boxShadow: '0 4px 18px rgba(129,20,83,0.30)' }}
      >
        {isPending ? <><Spinner /> מחשבת...</> : <><span className="text-lg">🍲</span> לוקחת על עצמי</>}
      </button>
      {error && <ConflictMsg msg={error} />}
    </div>
  );
}

// ─── מוכן לאיסוף ─────────────────────────────────────────────────────────────
export function MarkReadyButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError]  = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          start(async () => {
            try { await markMealReady(mealId); }
            catch (err) { setError(err instanceof Error ? err.message : 'שגיאה'); }
          });
        }}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#059669,#10B981)', boxShadow: '0 4px 18px rgba(5,150,105,0.30)' }}
      >
        {isPending ? <><Spinner /> שומרת...</> : <><span className="text-lg">✅</span> מוכן לאיסוף!</>}
      </button>
      {error && <ConflictMsg msg={error} />}
    </div>
  );
}

// ─── הזמנת פריט שבת ──────────────────────────────────────────────────────────
export function ReserveMealItemButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [isPending, start] = useTransition();
  const [error, setError]  = useState<string | null>(null);
  const [done,   setDone]  = useState(false);

  if (done) {
    return (
      <span className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: '#059669' }}>✓ שלי</span>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          start(async () => {
            try {
              await reserveMealItem(itemId);
              setDone(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה');
            }
          });
        }}
        className="rounded-full px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-50"
        style={{ backgroundColor: '#811453' }}
      >
        {isPending ? '...' : `לקחתי — ${itemName}`}
      </button>
      {error && <p className="text-[10px] text-amber-700">{error}</p>}
    </div>
  );
}

// ─── החזרת פריט שבת ──────────────────────────────────────────────────────────
export function ReleaseMealItemButton({ itemId }: { itemId: string }) {
  const [isPending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => start(() => releaseMealItem(itemId))}
      className="rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50"
      style={{ backgroundColor: '#FBE4F0', color: '#811453' }}
    >
      {isPending ? '...' : 'להחזיר'}
    </button>
  );
}
