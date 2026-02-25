'use client';

import { useState, useTransition } from 'react';
import { addMealItem, removeMealItem } from '../actions/meals';

const ITEM_TYPES = [
  { value: 'protein',  label: '🥩 חלבון' },
  { value: 'side',     label: '🥔 תוספת' },
  { value: 'salad',    label: '🥗 סלט' },
  { value: 'soup',     label: '🍲 מרק' },
  { value: 'dessert',  label: '🍮 קינוח' },
  { value: 'other',    label: '🍽️ אחר' },
];

interface Item {
  id: string;
  item_name: string;
  item_type: string;
  cook_id: string | null;
  cook?: { name?: string } | null;
}

export default function MealItemsEditor({ mealId, items }: { mealId: string; items: Item[] }) {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState('');
  const [type, setType]         = useState('other');
  const [isPending, start]      = useTransition();

  function handleAdd() {
    if (!name.trim()) return;
    start(async () => {
      await addMealItem(mealId, name.trim(), type);
      setName('');
    });
  }

  return (
    <div className="border-t border-[#FBE4F0]">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold"
        style={{ color: '#7C3AED' }}>
        <span>{open ? '▲ סגור' : '▼ פריטי שבת'}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px]"
              style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
          {items.length} פריטים
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {/* קיימים */}
          {items.map((item) => (
            <div key={item.id}
                 className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
              <div className="flex items-center gap-2">
                {!item.cook_id && (
                  <form onSubmit={(e) => { e.preventDefault(); start(() => removeMealItem(item.id)); }}>
                    <button type="submit" className="text-xs text-red-400 underline">מחק</button>
                  </form>
                )}
                {item.cook_id && (
                  <span className="text-[10px] text-zinc-400">{item.cook?.name ?? '?'}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900">{item.item_name}</p>
                <p className="text-[10px] text-zinc-400">
                  {ITEM_TYPES.find((t) => t.value === item.item_type)?.label ?? item.item_type}
                  {item.cook_id ? ' · לקוח ✓' : ' · פנוי'}
                </p>
              </div>
            </div>
          ))}

          {/* הוספה */}
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={isPending || !name.trim()}
              className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: '#7C3AED' }}>
              {isPending ? '...' : '+ הוסף'}
            </button>
            <select value={type} onChange={(e) => setType(e.target.value)}
                    className="rounded-xl border border-zinc-200 px-2 py-2 text-xs text-zinc-700">
              {ITEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="שם הפריט"
                   className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#7C3AED]" />
          </div>
        </div>
      )}
    </div>
  );
}
