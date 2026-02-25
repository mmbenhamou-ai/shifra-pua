'use client';

import { useState, useTransition } from 'react';
import { takeDelivery, markPickedUp, markDelivered } from '@/app/actions/meals';

export function TakeDeliveryButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm('לקחת משלוח זה על עצמך — האם את בטוחה?')) return;
          setError(null);
          start(async () => {
            try {
              await takeDelivery(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בלקיחת המשלוח');
            }
          });
        }}
        disabled={isPending}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #811453 0%, #a0185f 100%)', boxShadow: '0 4px 18px rgba(129,20,83,0.35)' }}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            מחשב...
          </span>
        ) : (
          <><span className="text-lg">🚗</span> לקחתי על עצמי</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 text-right">{error}</p>}
    </div>
  );
}

export function PickedUpButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm('לאשר שאספת את הארוחה מהמבשלת?')) return;
          setError(null);
          start(async () => {
            try {
              await markPickedUp(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה באישור האיסוף');
            }
          });
        }}
        disabled={isPending}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            שומרת...
          </span>
        ) : (
          <><span className="text-lg">📦</span> נאסף — בדרך ליולדת</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 text-right">{error}</p>}
    </div>
  );
}

export function DeliveredButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm('לאשר שמסרת את הארוחה ליולדת?')) return;
          setError(null);
          start(async () => {
            try {
              await markDelivered(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה באישור המסירה');
            }
          });
        }}
        disabled={isPending}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', boxShadow: '0 4px 18px rgba(5,150,105,0.35)' }}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            שומרת...
          </span>
        ) : (
          <><span className="text-lg">✅</span> נמסר בהצלחה!</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 text-right">{error}</p>}
    </div>
  );
}
