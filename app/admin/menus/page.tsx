import { createSupabaseServerClient } from '@/lib/supabase-server';
import { toggleMenuActive, deleteMenu } from '../actions/menus';
import CreateMenuForm from './CreateMenuForm';

const TYPE_LABELS: Record<string, string> = {
  breakfast:        'ארוחת בוקר',
  shabbat_friday:   'ארוחת שבת (ליל)',
  shabbat_saturday: 'ארוחת שבת (צהריים)',
};

export default async function MenusPage() {
  const supabase = await createSupabaseServerClient();

  const { data: menus, error } = await supabase
    .from('menus')
    .select('id, name, type, items, active, created_at')
    .order('created_at', { ascending: false });

  const list = menus ?? [];

  return (
    <div className="space-y-6 pb-2" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>
          תפריטים
        </h1>
        <p className="text-sm" style={{ color: '#7C365F' }}>
          {list.length} תפריטים במערכת
        </p>
      </header>

      {/* טופס יצירת תפריט — Client Component נפרד למנוע hydration mismatch */}
      <CreateMenuForm />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          שגיאה בטעינת הנתונים: {error.message}
        </p>
      )}

      {/* רשימת תפריטים */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: '#811453' }}>
          תפריטים קיימים
        </h2>

        {list.length === 0 ? (
          <p className="text-sm" style={{ color: '#7C365F' }}>
            אין עדיין תפריטים. צרי תפריט ראשון למעלה.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((m) => (
              <li
                key={m.id as string}
                className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-[#FBE4F0] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: m.active ? '#D1FAE5' : '#F3F4F6',
                        color: m.active ? '#065F46' : '#6B7280',
                      }}
                    >
                      {m.active ? 'פעיל' : 'לא פעיל'}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: '#FBE4F0', color: '#811453' }}
                    >
                      {TYPE_LABELS[m.type as string] ?? m.type}
                    </span>
                  </div>
                  <span className="text-base font-semibold" style={{ color: '#4A0731' }}>
                    {m.name as string}
                  </span>
                </div>

                <ul className="px-4 py-2 text-right">
                  {(m.items as string[]).map((item, i) => (
                    <li key={i} className="py-0.5 text-sm" style={{ color: '#4A0731' }}>
                      • {item}
                    </li>
                  ))}
                </ul>

                <div className="flex justify-start gap-2 border-t border-[#FBE4F0] px-4 py-3">
                  <form action={toggleMenuActive.bind(null, m.id as string, m.active as boolean)}>
                    <button
                      type="submit"
                      className="min-h-[40px] rounded-full border px-4 text-xs font-semibold transition active:opacity-80"
                      style={{
                        borderColor: '#F7D4E2',
                        color: '#811453',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {m.active ? 'השבתה' : 'הפעלה'}
                    </button>
                  </form>

                  <form action={deleteMenu.bind(null, m.id as string)}>
                    <button
                      type="submit"
                      className="min-h-[40px] rounded-full border px-4 text-xs font-semibold text-red-600 transition active:opacity-80"
                      style={{ borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}
                    >
                      מחיקה
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
