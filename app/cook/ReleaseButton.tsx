'use client';

import { useState, useTransition } from 'react';
import { releaseMealAsCook } from '@/app/actions/release';

export default function ReleaseButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-2 space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm('להחזיר ארוחה זו לרשימה הפנויה? פעולה זו לא ניתנת לביטול.')) return;
          setError(null);
          start(async () => {
            try {
              await releaseMealAsCook(mealId);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'שגיאה בהחזרת הארוחה');
            }
          });
        }}
        disabled={isPending}
        className="flex min-h-[40px] w-full items-center justify-center rounded-xl border text-sm font-semibold transition active:scale-[0.97] disabled:opacity-40"
        style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FFF5F5' }}
      >
        {isPending ? '...' : '↩ להחזיר לרשימה הפנויה'}
      </button>
      {error && <p className="text-xs text-red-600 text-right">{error}</p>}
    </div>
  );
}
