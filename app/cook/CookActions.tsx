'use client';

import { useState, useTransition } from 'react';
import { takeMeal, markMealReady } from '@/app/actions/meals';

export function TakeMealButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm('לקחת ארוחה זו על עצמך — האם את בטוחה?')) return;
          setError(null);
          start(async () => {
            try {
              await takeMeal(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בלקיחת הארוחה');
            }
          });
        }}
        disabled={isPending}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #811453 0%, #a0185f 100%)', boxShadow: '0 4px 18px rgba(129,20,83,0.30)' }}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            מחשב...
          </span>
        ) : (
          <><span className="text-lg">🍲</span> לוקחת על עצמי</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 text-right">{error}</p>}
    </div>
  );
}

export function MarkReadyButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm('לסמן ארוחה זו כמוכנה לאיסוף?')) return;
          setError(null);
          start(async () => {
            try {
              await markMealReady(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בעדכון הסטטוס');
            }
          });
        }}
        disabled={isPending}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', boxShadow: '0 4px 18px rgba(5,150,105,0.30)' }}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            שומרת...
          </span>
        ) : (
          <><span className="text-lg">✅</span> מוכן לאיסוף!</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 text-right">{error}</p>}
    </div>
  );
}
