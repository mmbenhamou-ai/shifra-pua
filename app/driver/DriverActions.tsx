'use client';

import { useTransition } from 'react';
import { takeDelivery, markPickedUp, markDelivered } from '@/app/actions/meals';

export function TakeDeliveryButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm('לקחת משלוח זה על עצמך — האם את בטוחה?')) return;
        start(async () => { await takeDelivery(mealId); });
      }}
      disabled={isPending}
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #811453 0%, #a0185f 100%)', boxShadow: '0 4px 18px rgba(129,20,83,0.35)' }}
    >
      {isPending ? (
        <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> מחשב...</span>
      ) : (
        <><span className="text-lg">🚗</span> לקחתי על עצמי</>
      )}
    </button>
  );
}

export function PickedUpButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm('לאשר שאספת את הארוחה מהמבשלת?')) return;
        start(async () => { await markPickedUp(mealId); });
      }}
      disabled={isPending}
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}
    >
      {isPending ? (
        <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> שומרת...</span>
      ) : (
        <><span className="text-lg">📦</span> נאסף — בדרך ליולדת</>
      )}
    </button>
  );
}

export function DeliveredButton({ mealId }: { mealId: string }) {
  const [isPending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm('לאשר שמסרת את הארוחה ליולדת?')) return;
        start(async () => { await markDelivered(mealId); });
      }}
      disabled={isPending}
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', boxShadow: '0 4px 18px rgba(5,150,105,0.35)' }}
    >
      {isPending ? (
        <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> שומרת...</span>
      ) : (
        <><span className="text-lg">✅</span> נמסר בהצלחה!</>
      )}
    </button>
  );
}
