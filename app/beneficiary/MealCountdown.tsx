'use client';

import { useMemo } from 'react';

export default function MealCountdown({ endDate }: { endDate: string | null }) {
  const info = useMemo(() => {
    if (!endDate) return null;
    const end  = new Date(endDate);
    const now  = new Date();
    // Normalize to midnight
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs   = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [endDate]);

  if (info === null) return null;

  if (info < 0) {
    return (
      <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 text-right shadow-sm">
        <p className="text-sm font-semibold text-zinc-500">שירות הארוחות הסתיים 🎉</p>
        <p className="text-xs text-zinc-400 mt-0.5">תודה על השימוש בשפרה פועה!</p>
      </div>
    );
  }

  if (info === 0) {
    return (
      <div className="rounded-2xl border border-[#F7D4E2] bg-[#FEF9C3] px-4 py-3 text-right shadow-sm">
        <p className="text-sm font-semibold text-zinc-800">היום הוא היום האחרון לארוחות 🌟</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] text-zinc-400">עד</p>
          <p className="text-xs text-zinc-500">
            {new Date(endDate!).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 mb-0.5">נותרו</p>
          <p className="text-3xl font-extrabold leading-none" style={{ color: '#811453' }}>
            {info}
          </p>
          <p className="text-xs font-medium text-zinc-500">ימים של ארוחות</p>
        </div>
      </div>
      {/* Progress bar */}
    </div>
  );
}
