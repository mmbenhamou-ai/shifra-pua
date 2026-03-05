'use client';

import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { useState, useTransition } from 'react';

type Meal = {
  id: string;
  date: string;
  status: string;
  service_type?: 'breakfast' | 'shabbat' | null;
  pickup_location?: string | null;
  address?: string | null;
  yoledet?: { display_name?: string | null; phone?: string | null } | null;
};

type Props = {
  meal: Meal;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  actionLabel: string;
  showPickup?: boolean;
  showAddress?: boolean;
  /** Stable id for E2E (e.g. take-cooking, mark-ready, take-delivery, mark-delivered) */
  dataTestId?: string;
};

const SERVICE_LABELS: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  shabbat: 'ארוחת שבת',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'מחכה למתנדבת',
  cooking: 'בהכנה',
  ready: 'מוכנה לאיסוף',
  delivering: 'במשלוח',
  delivered: 'נמסרה',
  confirmed: 'אושרה',
};

export default function TaskCard({
  meal,
  action,
  actionLabel,
  showPickup,
  showAddress,
  dataTestId,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const d = new Date(meal.date);
  const dateLabel = d.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  const serviceLabel = SERVICE_LABELS[meal.service_type ?? ''] ?? 'ארוחה';
  const statusLabel = STATUS_LABELS[meal.status] ?? meal.status;
  const yoledetName = meal.yoledet?.display_name ?? 'יולדת';

  const contactPhone = (meal.yoledet?.phone as string | null) ?? null;

  const note =
    showPickup || showAddress ? 'אני בדרך עם הארוחה שלך' : 'מוכן לאיסוף';

  const handleWhatsApp = () => {
    if (!contactPhone) return;
    const parts = [
      'שלום,',
      `הודעה לגבי ${serviceLabel} בתאריך ${dateLabel}.`,
    ];
    if (showPickup && meal.pickup_location) {
      parts.push(`מקום איסוף: ${meal.pickup_location}`);
    }
    if (showAddress && meal.address) {
      parts.push(`כתובת משלוח: ${meal.address}`);
    }
    parts.push(note);
    const message = parts.join('\n');
    const url = buildWhatsAppUrl(contactPhone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col text-right">
          <span className="text-xs text-slate-500">{dateLabel}</span>
          <span className="font-semibold text-slate-900">
            {serviceLabel} — {yoledetName}
          </span>
          <span className="text-sm text-slate-600">{statusLabel}</span>
          {showPickup && meal.pickup_location && (
            <span className="text-xs text-slate-500 mt-1">
              איסוף: {meal.pickup_location}
            </span>
          )}
          {showAddress && meal.address && (
            <span className="text-xs text-slate-500 mt-1">
              כתובת: {meal.address}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {contactPhone && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="min-h-[48px] px-4 rounded-full border border-[#25D366] text-[#128C7E] text-sm font-semibold bg-white active:opacity-80"
          >
            שלח וואטסאפ
          </button>
        )}

        <form
          action={(formData: FormData) => {
            setError(null);
            startTransition(async () => {
              const res = await action(formData);
              if (res && typeof res === 'object' && 'error' in res && res.error) {
                setError(res.error as string);
              }
            });
          }}
          className="flex items-center"
        >
          <input type="hidden" name="meal_id" value={meal.id} />
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[48px] px-5 rounded-full bg-[#91006A] text-white text-sm font-semibold active:opacity-80"
            data-testid={dataTestId ?? undefined}
          >
            {actionLabel}
          </button>
        </form>
      </div>
      {error && (
        <p className="text-xs text-red-600 text-right mt-1">{error}</p>
      )}
    </div>
  );
}

