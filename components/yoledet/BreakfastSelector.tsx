import type { FormEvent } from 'react';

type BreakfastMenuItem = {
  id: string;
  title_he: string;
};

type Meal = {
  id: string;
  date: string;
  service_type?: 'breakfast' | 'shabbat' | null;
};

type Props = {
  breakfastMenu: BreakfastMenuItem[];
  meals: Meal[];
  createAction: (formData: FormData) => void;
};

export default function BreakfastSelector({ breakfastMenu, meals, createAction }: Props) {
  const existingBreakfastDates = new Set(
    meals
      .filter((m) => m.service_type === 'breakfast')
      .map((m) => m.date),
  );

  const handleSubmit = (formData: FormData) => {
    const date = formData.get('delivery_date') as string | null;
    if (!date) return;
    createAction(formData);
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
      <div className="flex flex-col text-right gap-1">
        <h2 className="text-lg font-semibold text-slate-900">בחירת ארוחת בוקר</h2>
        <p className="text-xs text-slate-600">
          ארוחת בוקר זמינה לכל היולדות. בחרי תאריך וארוחה מתאימה.
        </p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col text-right gap-1 text-sm text-slate-700">
          <span>תאריך המשלוח</span>
          <input
            type="date"
            name="delivery_date"
            className="border border-slate-200 rounded-xl px-3 h-11 text-sm bg-white"
          />
        </label>

        <label className="flex flex-col text-right gap-1 text-sm text-slate-700">
          <span>סוג ארוחת בוקר</span>
          <select
            name="menu_id"
            className="border border-slate-200 rounded-xl px-3 h-11 text-sm bg-white"
            defaultValue={breakfastMenu[0]?.id}
          >
            {breakfastMenu.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title_he}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="mt-2 min-h-[48px] rounded-full bg-[#91006A] text-white text-sm font-semibold active:opacity-80"
        >
          בחר
        </button>

        {existingBreakfastDates.size > 0 && (
          <p className="text-[11px] text-slate-500 text-right">
            שימי לב: אם כבר נוצרה ארוחת בוקר לתאריך שבחרת, הבקשה תתווסף כרשומה נוספת.
          </p>
        )}
      </form>
    </div>
  );
}

