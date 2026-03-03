import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import PreferencesForm from './PreferencesForm';

export default async function ShabbatPreferencesPage() {
  const { session } = await getSessionOrDevBypass();
  if (!session) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: beneficiary } = await supabase
    .from('beneficiaries')
    .select('is_vegetarian, spicy_level, cooking_notes, shabbat_friday, shabbat_saturday, shabbat_kashrut')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!beneficiary) redirect('/beneficiary');

  return (
    <div
      className="min-h-screen flex justify-center px-4 pb-10 pt-8"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <main className="w-full max-w-md space-y-6">
        <header className="flex items-center justify-between mb-2">
          <a
            href="/beneficiary"
            className="text-sm font-medium active:opacity-70"
            style={{ color: '#91006A' }}
          >
            ← חזרה
          </a>
          <h1 className="text-lg font-bold" style={{ color: '#91006A' }}>
            העדפות תפריט שבת
          </h1>
          <span className="w-10" />
        </header>

        <PreferencesForm
          initial={{
            is_vegetarian: beneficiary.is_vegetarian as boolean,
            spicy_level:   (beneficiary.spicy_level as number) ?? 0,
            cooking_notes: beneficiary.cooking_notes as string | null,
            shabbat_friday:   (beneficiary.shabbat_friday as boolean) ?? false,
            shabbat_saturday: (beneficiary.shabbat_saturday as boolean) ?? false,
            shabbat_kashrut:  (beneficiary.shabbat_kashrut as string) ?? 'רגיל',
          }}
        />
      </main>
    </div>
  );
}

