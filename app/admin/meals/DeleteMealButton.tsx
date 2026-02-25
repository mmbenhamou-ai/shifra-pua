'use client';

import { useState, useTransition } from 'react';
import { deleteMeal } from '../actions/meals';

export default function DeleteMealButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        disabled={isPending}
        onClick={() => {
          if (!window.confirm('האם למחוק ארוחה זו לצמיתות?')) return;
          setError(null);
          start(async () => {
            try {
              await deleteMeal(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה במחיקה');
            }
          });
        }}
        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition active:opacity-70 disabled:opacity-40"
      >
        {isPending ? '...' : '🗑️'}
      </button>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
