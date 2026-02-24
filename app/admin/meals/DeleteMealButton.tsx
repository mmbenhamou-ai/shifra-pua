'use client';

import { useTransition } from 'react';
import { deleteMeal } from '../actions/meals';

export default function DeleteMealButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (window.confirm('האם למחוק ארוחה זו לצמיתות?')) {
          start(async () => { await deleteMeal(mealId); });
        }
      }}
      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition active:opacity-70 disabled:opacity-40"
    >
      {isPending ? '...' : '🗑️'}
    </button>
  );
}
