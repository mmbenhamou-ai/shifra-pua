'use client';

import { useTransition } from 'react';
import { assignCook, assignDriver } from '../actions/meals';

interface Props {
  mealId: string;
  type: 'cook' | 'driver';
  currentId: string | null;
  volunteers: { id: string; name: string }[];
}

export default function AssignSelect({ mealId, type, currentId, volunteers }: Props) {
  const [isPending, start] = useTransition();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    start(async () => {
      if (type === 'cook') await assignCook(mealId, id);
      else await assignDriver(mealId, id);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={isPending}
        value={currentId ?? ''}
        onChange={handleChange}
        className="flex-1 rounded-xl border border-[#F7D4E2] bg-[#FFF7FB] px-2 py-1.5 text-xs text-zinc-800 focus:outline-none disabled:opacity-50"
      >
        <option value="">{type === 'cook' ? '— ללא מבשלת —' : '— ללא מחלקת —'}</option>
        {volunteers.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      <span className="text-xs text-zinc-500 flex-shrink-0">
        {type === 'cook' ? '🍲 מבשלת' : '🚗 מחלקת'}
      </span>
    </div>
  );
}
