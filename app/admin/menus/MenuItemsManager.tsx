'use client';

import { useTransition } from 'react';
import { reorderMenuItems, addMenuItem, removeMenuItem } from '../actions/menus';

export default function MenuItemsManager({
  menuId,
  items,
}: {
  menuId: string;
  items: string[];
}) {
  const [isPending, start] = useTransition();

  function moveItem(from: number, to: number) {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    start(async () => { await reorderMenuItems(menuId, next); });
  }

  return (
    <div className="px-4 py-3 space-y-1.5">
      {items.map((item, i) => (
        <div key={i}
             className="flex items-center justify-between gap-2 rounded-xl border border-[#F7D4E2] bg-[#FFF7FB] px-3 py-2">
          {/* מחיקה */}
          <button
            disabled={isPending}
            onClick={() => {
              if (window.confirm(`למחוק "${item}"?`)) {
                start(async () => { await removeMenuItem(menuId, items, i); });
              }
            }}
            className="text-red-400 hover:text-red-600 transition text-sm disabled:opacity-40"
            title="מחק מנה"
          >
            ✕
          </button>

          {/* חצים */}
          <div className="flex flex-col gap-0.5">
            <button
              disabled={isPending || i === 0}
              onClick={() => moveItem(i, i - 1)}
              className="text-[#811453] disabled:opacity-30 text-xs leading-none"
              title="למעלה"
            >▲</button>
            <button
              disabled={isPending || i === items.length - 1}
              onClick={() => moveItem(i, i + 1)}
              className="text-[#811453] disabled:opacity-30 text-xs leading-none"
              title="למטה"
            >▼</button>
          </div>

          {/* שם */}
          <span className="flex-1 text-sm text-zinc-800 text-right">{item}</span>
          <span className="text-zinc-400 text-xs">{i + 1}.</span>
        </div>
      ))}

      {/* הוספת מנה */}
      <form
        action={async (fd) => {
          const newItem = fd.get('newItem') as string;
          start(async () => { await addMenuItem(menuId, items, newItem); });
        }}
        className="flex items-center gap-2 pt-1"
      >
        <button
          type="submit"
          disabled={isPending}
          className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#811453' }}
        >
          + הוסף
        </button>
        <input
          name="newItem"
          placeholder="מנה חדשה..."
          className="flex-1 rounded-xl border border-[#F7D4E2] bg-white px-3 py-2 text-sm text-zinc-900 text-right placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#811453]"
        />
      </form>

      {isPending && (
        <p className="text-center text-xs text-zinc-400 animate-pulse">שומרת...</p>
      )}
    </div>
  );
}
