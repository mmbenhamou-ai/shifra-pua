'use client';

import { useTransition } from 'react';
import { takeDelivery, markPickedUp, markDelivered } from '@/app/actions/meals';

export function TakeDeliveryButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  function handle() {
    if (!window.confirm('לקחת משלוח זה על עצמך — האם את בטוחה?')) return;
    start(async () => { await takeDelivery(mealId); });
  }
  return (
    <button type="button" onClick={handle} disabled={isPending}
      className="mt-4 min-h-[52px] w-full rounded-2xl text-sm font-bold text-white shadow-md shadow-[#811453]/25 transition active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: '#811453' }}>
      {isPending ? '...שומרת' : 'לקחתי על עצמי ✓'}
    </button>
  );
}

export function PickedUpButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  function handle() {
    if (!window.confirm('לאשר שאספת את הארוחה מהמבשלת?')) return;
    start(async () => { await markPickedUp(mealId); });
  }
  return (
    <button type="button" onClick={handle} disabled={isPending}
      className="min-h-[52px] w-full rounded-2xl text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: '#8B5CF6' }}>
      {isPending ? '...שומרת' : 'נאסף ✓'}
    </button>
  );
}

export function DeliveredButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  function handle() {
    if (!window.confirm('לאשר שמסרת את הארוחה ליולדת?')) return;
    start(async () => { await markDelivered(mealId); });
  }
  return (
    <button type="button" onClick={handle} disabled={isPending}
      className="min-h-[52px] w-full rounded-2xl text-sm font-bold text-white shadow-md shadow-[#811453]/25 transition active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: '#811453' }}>
      {isPending ? '...שומרת' : 'נמסר ✓'}
    </button>
  );
}
