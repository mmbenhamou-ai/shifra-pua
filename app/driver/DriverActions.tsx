'use client';

import { useEffect, useState, useTransition } from 'react';
import { takeDelivery, markPickedUp, markDelivered } from '@/app/actions/meals';
export { useMealRealtime, ConflictBanner } from '@/app/components/RealtimeMealList';
import { buildWazeUrl } from '@/lib/utils';

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

function ConflictMsg({ msg, onClose }: { msg: string; onClose: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
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

export function TakeDeliveryButton({ mealId }: { mealId: string }) {
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
              await takeDelivery(mealId);
              setTaken(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בלקיחת המשלוח');
            }
          });
        }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,var(--brand),#a0185f)', boxShadow: '0 4px 18px rgba(129,20,83,0.35)' }}
      >
        {isPending ? <><Spinner /> מחשבת...</> : <><span className="text-lg">🚗</span> לקחתי על עצמי</>}
      </button>
      {error && <ConflictMsg msg={error} onClose={() => setError(null)} />}
    </div>
  );
}

// נאסף + פתח Waze ליולדת
export function PickedUpButton({ mealId, benAddress }: { mealId: string; benAddress?: string | null }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const navUrl = benAddress ? buildWazeUrl(benAddress) : null;
  const disabledNav = !navUrl;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending || disabledNav}
        title={disabledNav ? 'Adresse manquante' : undefined}
        onClick={() => {
          if (disabledNav) {
            setError('Adresse manquante');
            return;
          }
          setError(null);
          start(async () => {
            try {
              await markPickedUp(mealId);
              if (navUrl) {
                window.open(navUrl, '_blank');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה');
            }
          });
        }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}
      >
        {isPending ? <><Spinner /> שומרת...</> : <><span className="text-lg">📦</span> נאסף — אני בדרך ליולדת 🗺️</>}
      </button>
      {error && <ConflictMsg msg={error} onClose={() => setError(null)} />}
    </div>
  );
}

export function DeliveredButton({ mealId }: { mealId: string }) {
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
            try { await markDelivered(mealId); }
            catch (err) { setError(err instanceof Error ? err.message : 'שגיאה'); }
          });
        }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 18px rgba(5,150,105,0.35)' }}
      >
        {isPending ? <><Spinner /> שומרת...</> : <><span className="text-lg">✅</span> נמסר בהצלחה!</>}
      </button>
      {error && <ConflictMsg msg={error} onClose={() => setError(null)} />}
    </div>
  );
}
