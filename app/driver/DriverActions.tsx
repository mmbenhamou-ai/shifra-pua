'use client';

import { useState, useTransition } from 'react';
import { takeDelivery, markPickedUp, markDelivered } from '@/app/actions/meals';
export { useMealRealtime, ConflictBanner } from '@/app/components/RealtimeMealList';

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

function ConflictMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-right">
      <span className="text-base">⚠️</span>
      <p className="text-xs font-medium text-amber-800">{msg}</p>
    </div>
  );
}

export function TakeDeliveryButton({ mealId }: { mealId: string }) {
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
              await takeDelivery(mealId);
              setTaken(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בלקיחת המשלוח');
            }
          });
        }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#811453,#a0185f)', boxShadow: '0 4px 18px rgba(129,20,83,0.35)' }}
      >
        {isPending ? <><Spinner /> מחשבת...</> : <><span className="text-lg">🚗</span> לקחתי על עצמי</>}
      </button>
      {error && <ConflictMsg msg={error} />}
    </div>
  );
}

// נאסף + פתח Waze ליולדת
export function PickedUpButton({ mealId, benAddress }: { mealId: string; benAddress?: string | null }) {
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
            try {
              await markPickedUp(mealId);
              // Ouvre Waze vers la יולדת après confirmation
              if (benAddress) {
                const encoded = encodeURIComponent(benAddress);
                window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
              }
            } catch (err) { setError(err instanceof Error ? err.message : 'שגיאה'); }
          });
        }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}
      >
        {isPending ? <><Spinner /> שומרת...</> : <><span className="text-lg">📦</span> נאסף — אני בדרך ליולדת 🗺️</>}
      </button>
      {error && <ConflictMsg msg={error} />}
    </div>
  );
}

export function DeliveredButton({ mealId }: { mealId: string }) {
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
            try { await markDelivered(mealId); }
            catch (err) { setError(err instanceof Error ? err.message : 'שגיאה'); }
          });
        }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 18px rgba(5,150,105,0.35)' }}
      >
        {isPending ? <><Spinner /> שומרת...</> : <><span className="text-lg">✅</span> נמסר בהצלחה!</>}
      </button>
      {error && <ConflictMsg msg={error} />}
    </div>
  );
}
