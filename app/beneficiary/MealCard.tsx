'use client';

import { useTransition } from 'react';
import { confirmMealReceived } from '@/app/actions/meals';

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  open:            { label: 'פנויה — אין מתנדבת עדיין', color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  cook_assigned:   { label: 'יש מבשלת 🍲',              color: '#1E40AF', bg: '#DBEAFE', dot: '#3B82F6' },
  ready:           { label: 'מוכנה — ממתינה לאיסוף',    color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  driver_assigned: { label: 'יש מחלקת 🚗',              color: '#5B21B6', bg: '#EDE9FE', dot: '#8B5CF6' },
  picked_up:       { label: 'בדרך אלייך! 🚗',           color: '#9A3412', bg: '#FED7AA', dot: '#F97316' },
  delivered:       { label: 'נמסרה — ממתינה לאישורך',   color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  confirmed:       { label: 'התקבלה ✓',                  color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const TYPE_LABELS: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  shabbat_friday: 'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

interface Meal {
  id: string;
  date: string;
  type: string;
  status: string;
  cook?: string | null;
  driver?: string | null;
}

export default function MealCard({ meal }: { meal: Meal }) {
  const [isPending, startTransition] = useTransition();
  const st = STATUS[meal.status] ?? { label: meal.status, color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' };
  const isDelivered = meal.status === 'delivered';
  const isConfirmed = meal.status === 'confirmed';

  function handleConfirm() {
    if (!window.confirm('אישור קבלת הארוחה — האם הכל בסדר?')) return;
    startTransition(async () => { await confirmMealReceived(meal.id); });
  }

  return (
    <li className="overflow-hidden rounded-2xl border bg-white shadow-md shadow-[#811453]/5 transition-all active:scale-[0.99]"
        style={{ borderColor: isDelivered ? '#811453' : '#F7D4E2', borderWidth: isDelivered ? 2 : 1 }}>
      {/* פס צבע עליון */}
      <div className="h-1 w-full" style={{ backgroundColor: st.dot }} />

      <div className="px-4 py-4">
        {/* שורה ראשונה: תאריך + סוג */}
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: st.bg, color: st.color }}>
            {st.label}
          </span>
          <div className="text-right">
            <p className="text-sm font-bold text-zinc-900">
              {TYPE_LABELS[meal.type] ?? meal.type}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(meal.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* מבשלת / מחלקת */}
        {(meal.cook || meal.driver) && (
          <div className="mt-3 flex flex-col items-end gap-1 rounded-xl bg-[#FFF7FB] px-3 py-2">
            {meal.cook   && <span className="text-xs text-zinc-700">🍲 מבשלת: <strong>{meal.cook}</strong></span>}
            {meal.driver && <span className="text-xs text-zinc-700">🚗 מחלקת: <strong>{meal.driver}</strong></span>}
          </div>
        )}

        {/* כפתור אישור קבלה */}
        {isDelivered && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="mt-4 min-h-[52px] w-full rounded-2xl text-sm font-bold text-white shadow-md shadow-[#811453]/30 transition active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: '#811453' }}
          >
            {isPending ? '...שומרת' : 'אישור קבלה ✓'}
          </button>
        )}

        {isConfirmed && (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-50 py-2">
            <span className="text-xs text-zinc-500">התקבלה בהצלחה ✓</span>
          </div>
        )}
      </div>
    </li>
  );
}
