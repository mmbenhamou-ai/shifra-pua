'use client';

import { useTransition } from 'react';
import { takeMeal, markMealReady } from '@/app/actions/meals';

export function TakeMealButton({ mealId }: { mealId: string }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!window.confirm('לקחת ארוחה זו על עצמך — האם את בטוחה?')) return;
    startTransition(async () => { await takeMeal(mealId); });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="mt-4 min-h-[52px] w-full rounded-2xl text-sm font-bold text-white shadow-md shadow-[#811453]/25 transition active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: '#811453' }}
    >
      {isPending ? '...שומרת' : 'לקחתי על עצמי ✓'}
    </button>
  );
}

export function MarkReadyButton({ mealId }: { mealId: string }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!window.confirm('לסמן ארוחה זו כמוכנה לאיסוף?')) return;
    startTransition(async () => { await markMealReady(mealId); });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="mt-4 min-h-[52px] w-full rounded-2xl text-sm font-bold text-white shadow-md shadow-[#811453]/25 transition active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: '#059669' }}
    >
      {isPending ? '...שומרת' : 'מוכן לאיסוף ✓'}
    </button>
  );
}
