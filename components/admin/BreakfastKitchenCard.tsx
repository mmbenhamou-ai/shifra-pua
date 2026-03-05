'use client';

import { useState, useTransition } from 'react';

type BreakfastMeal = {
  id: string;
  date: string;
  yoledet?: { id: string; display_name: string | null } | null;
  menu?: { id: string; title_he: string | null } | null;
};

type Props = {
  meal: BreakfastMeal;
  markReadyAction: (formData: FormData) => Promise<{ error?: string } | void>;
};

export default function BreakfastKitchenCard({ meal, markReadyAction }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const d = new Date(meal.date);
  const dateLabel = d.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  const yoledetName = meal.yoledet?.display_name ?? 'יולדת';
  const breakfastLabel = meal.menu?.title_he ?? 'ארוחת בוקר';

  const handleAction = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await markReadyAction(formData);
      if (res && typeof res === 'object' && 'error' in res && res.error) {
        setError(res.error as string);
      }
    });
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col text-right">
          <span className="text-xs text-slate-500">{dateLabel}</span>
          <span className="font-semibold text-slate-900">{yoledetName}</span>
          <span className="text-sm text-slate-600">{breakfastLabel}</span>
        </div>
      </div>

      <form action={handleAction} className="flex items-center justify-end">
        <input type="hidden" name="mealId" value={meal.id} />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[48px] px-5 rounded-full bg-emerald-600 text-white text-sm font-semibold active:opacity-80"
        >
          סומן כמוכן
        </button>
      </form>
      {error && (
        <p className="text-xs text-red-600 text-right mt-1">{error}</p>
      )}
    </div>
  );
}

