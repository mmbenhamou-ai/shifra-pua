'use client';

import { useEffect, useState, useTransition } from 'react';
import { takeMeal, markMealReady, reserveMealItem, releaseMealItem } from '@/app/actions/meals';
export { useMealRealtime, ConflictBanner } from '@/app/components/RealtimeMealList';

// ─── Spinner helper ───────────────────────────────────────────────────────────
function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

// ─── Conflict / error toast ───────────────────────────────────────────────────
function ConflictMsg({ msg, onClose }: { msg: string; onClose: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      const cleanup = setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [msg, onClose]);

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-right shadow-lg"
        style={{
          backgroundColor: '#FEF3C7',
          borderColor: '#FBBF24',
          color: '#92400E',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: 'auto',
        }}
      >
        <span className="text-base">⚠️</span>
        <p className="flex-1 text-xs font-medium">{msg}</p>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 text-xs font-bold"
          aria-label="סגירת ההודעה"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── לוקחת ארוחה ─────────────────────────────────────────────────────────────
export function TakeMealButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState(false);

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
        style={{ background: 'linear-gradient(135deg,var(--brand),#a0185f)', boxShadow: '0 4px 18px rgba(129,20,83,0.30)' }}
      >
        {isPending ? <><Spinner /> מחשבת...</> : <><span className="text-lg">🍲</span> לוקחת על עצמי</>}
      </button>
      {error && <ConflictMsg msg={error} onClose={() => setError(null)} />}
    </div>
  );
}

// ─── מוכן לאיסוף ─────────────────────────────────────────────────────────────
export function MarkReadyButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      {error && <ConflictMsg msg={error} onClose={() => setError(null)} />}
    </div>
  );
}

// ─── הזמנת פריט שבת ──────────────────────────────────────────────────────────
export function ReserveMealItemButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
        style={{ backgroundColor: 'var(--brand)' }}
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
      style={{ backgroundColor: '#FBE4F0', color: 'var(--brand)' }}
    >
      {isPending ? '...' : 'להחזיר'}
    </button>
  );
}
