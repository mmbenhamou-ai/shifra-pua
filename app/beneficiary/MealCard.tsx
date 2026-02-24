'use client';

import { useTransition } from 'react';
import { confirmMealReceived } from '@/app/actions/meals';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'שבת ליל',
  shabbat_saturday: 'שבת צהריים',
};

// Pipeline Wolt-style
const PIPELINE = [
  { key: 'open',            label: 'ממתינה',      icon: '🕐', desc: 'מחפשים מבשלת' },
  { key: 'cook_assigned',   label: 'מכינים',      icon: '🍲', desc: 'המבשלת מכינה' },
  { key: 'ready',           label: 'מוכן',        icon: '✅', desc: 'מוכן לאיסוף' },
  { key: 'driver_assigned', label: 'בדרך',        icon: '🚗', desc: 'מחלקת בדרך' },
  { key: 'picked_up',       label: 'קרוב!',       icon: '📍', desc: 'בדרך אלייך' },
  { key: 'delivered',       label: 'הגיע!',       icon: '🎉', desc: 'ממתין לאישורך' },
  { key: 'confirmed',       label: 'אושר',        icon: '💛', desc: 'תהני!' },
];

interface Meal {
  id: string;
  date: string;
  type: string;
  status: string;
  cook?: string | null;
  driver?: string | null;
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function isTomorrow(dateStr: string): boolean {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return dateStr === t.toISOString().split('T')[0];
}

function dateLabel(dateStr: string): string {
  if (isToday(dateStr))    return 'היום';
  if (isTomorrow(dateStr)) return 'מחר';
  return new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function MealCard({ meal, featured = false }: { meal: Meal; featured?: boolean }) {
  const [isPending, start] = useTransition();

  const stepIdx   = PIPELINE.findIndex((p) => p.key === meal.status);
  const step      = PIPELINE[stepIdx] ?? PIPELINE[0];
  const pct       = stepIdx < 0 ? 0 : Math.round(((stepIdx + 1) / PIPELINE.length) * 100);
  const isDelivered = meal.status === 'delivered';
  const isConfirmed = meal.status === 'confirmed';
  const todayMeal   = isToday(meal.date);

  if (featured) {
    // ── CARTE PRINCIPALE (aujourd'hui, style Wolt grande carte) ──
    return (
      <div className="overflow-hidden rounded-3xl shadow-2xl"
           style={{ boxShadow: '0 12px 40px rgba(129,20,83,0.18)' }}>
        {/* Gradient header */}
        <div className="relative px-5 pt-5 pb-4"
             style={{ background: isDelivered ? 'linear-gradient(135deg, #059669, #10B981)' : isConfirmed ? 'linear-gradient(135deg, #4B5563, #6B7280)' : 'linear-gradient(135deg, #811453, #4A0731)' }}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              {step.icon}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white/70">ארוחת היום</p>
              <p className="text-lg font-extrabold text-white">{TYPE_LABELS[meal.type] ?? meal.type}</p>
              <p className="text-sm text-white/80">{dateLabel(meal.date)}</p>
            </div>
          </div>

          {/* status label */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <p className="text-sm font-bold text-white">{step.desc}</p>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">{step.label}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white px-5 pt-4 pb-1">
          <div className="relative h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="absolute inset-y-0 right-0 rounded-full transition-all duration-700 ease-out"
                 style={{ width: `${pct}%`, background: isConfirmed ? '#9CA3AF' : 'linear-gradient(90deg, #811453, #F97316)' }} />
          </div>
          {/* Step dots */}
          <div className="mt-2 flex justify-between px-0.5">
            {PIPELINE.slice(0, 6).map((p, i) => {
              const done = i <= stepIdx;
              return (
                <div key={p.key} className="flex flex-col items-center gap-0.5">
                  <div className="h-1.5 w-1.5 rounded-full transition-all"
                       style={{ backgroundColor: done ? '#811453' : '#E5E7EB' }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Volunteer info */}
        <div className="bg-white px-5 py-3">
          {(meal.cook || meal.driver) ? (
            <div className="space-y-2">
              {meal.cook && (
                <div className="flex items-center justify-between rounded-2xl bg-[#FFF7FB] px-3 py-2.5">
                  <span className="text-lg">🍲</span>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-zinc-400">מבשלת</p>
                    <p className="text-sm font-bold text-zinc-900">{meal.cook}</p>
                  </div>
                </div>
              )}
              {meal.driver && (
                <div className="flex items-center justify-between rounded-2xl bg-[#FFF7FB] px-3 py-2.5">
                  <span className="text-lg">🚗</span>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-zinc-400">מחלקת</p>
                    <p className="text-sm font-bold text-zinc-900">{meal.driver}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2.5">
              <span className="text-sm text-amber-600">מחפשים מתנדבת...</span>
              <span className="text-lg">🔍</span>
            </div>
          )}
        </div>

        {/* Confirm button */}
        {isDelivered && (
          <div className="bg-white px-5 pb-5">
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('אישור קבלת הארוחה — האם הכל בסדר?')) return;
                start(async () => { await confirmMealReceived(meal.id); });
              }}
              disabled={isPending}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 4px 18px rgba(5,150,105,0.35)' }}
            >
              {isPending ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />שומרת...</span>
              ) : (
                <><span className="text-xl">✓</span> קיבלתי — תודה!</>
              )}
            </button>
          </div>
        )}
        {isConfirmed && (
          <div className="flex items-center justify-center gap-2 bg-white px-5 pb-5">
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 w-full justify-center">
              <span className="text-zinc-400 text-sm">התקבלה בהצלחה ✓</span>
              <span className="text-lg">💛</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CARTE SECONDAIRE (autres jours, compacte) ──
  return (
    <li className="overflow-hidden rounded-2xl border bg-white transition-all active:scale-[0.99]"
        style={{ borderColor: '#F0E8EC', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Step icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
             style={{ backgroundColor: isConfirmed ? '#F3F4F6' : '#FBE4F0' }}>
          {step.icon}
        </div>

        {/* Info */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-between">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: isConfirmed ? '#F3F4F6' : '#FBE4F0',
                           color:           isConfirmed ? '#9CA3AF' : '#811453' }}>
              {step.label}
            </span>
            <p className="text-sm font-bold text-zinc-900">{TYPE_LABELS[meal.type] ?? meal.type}</p>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">{dateLabel(meal.date)}</p>
          {meal.cook && <p className="mt-0.5 text-xs text-zinc-500">🍲 {meal.cook}</p>}
        </div>
      </div>

      {/* Mini progress */}
      <div className="mx-4 mb-3 h-1 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full transition-all duration-500"
             style={{ width: `${pct}%`, backgroundColor: isConfirmed ? '#9CA3AF' : '#811453' }} />
      </div>

      {isDelivered && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => {
              if (!window.confirm('אישור קבלת הארוחה — האם הכל בסדר?')) return;
              start(async () => { await confirmMealReceived(meal.id); });
            }}
            disabled={isPending}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
            style={{ backgroundColor: '#811453' }}
          >
            {isPending ? '...שומרת' : 'אישור קבלה ✓'}
          </button>
        </div>
      )}
    </li>
  );
}
