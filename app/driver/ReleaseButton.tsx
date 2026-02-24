'use client';

import { useTransition } from 'react';
import { releaseMealAsDriver } from '@/app/actions/release';

export default function ReleaseButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm('להחזיר משלוח זה לרשימה הפנויה? פעולה זו לא ניתנת לביטול.')) return;
        start(async () => { await releaseMealAsDriver(mealId); });
      }}
      disabled={isPending}
      className="mt-2 flex min-h-[40px] w-full items-center justify-center rounded-xl border text-sm font-semibold transition active:scale-[0.97] disabled:opacity-40"
      style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FFF5F5' }}
    >
      {isPending ? '...' : '↩ להחזיר לרשימה הפנויה'}
    </button>
  );
}
