'use client';

import { useTransition } from 'react';
import { updateMealStatus } from '../actions/meals';

const STATUSES = [
  { value: 'open',            label: 'פנויה' },
  { value: 'cook_assigned',   label: 'יש מבשלת' },
  { value: 'ready',           label: 'מוכנה לאיסוף' },
  { value: 'driver_assigned', label: 'יש מחלקת' },
  { value: 'picked_up',       label: 'נאסף' },
  { value: 'delivered',       label: 'נמסר' },
  { value: 'confirmed',       label: 'אושר ✓' },
];

export default function MealStatusSelect({ mealId, current }: { mealId: string; current: string }) {
  const [isPending, start] = useTransition();

  return (
    <select
      disabled={isPending}
      value={current}
      onChange={(e) => start(async () => { await updateMealStatus(mealId, e.target.value); })}
      className="rounded-xl border border-[#F7D4E2] bg-white px-2 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#811453] disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
