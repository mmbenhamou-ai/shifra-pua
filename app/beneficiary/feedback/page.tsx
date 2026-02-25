import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import FeedbackForm from './FeedbackForm';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ meal_id?: string }>;
}) {
  const { meal_id } = await searchParams;
  if (!meal_id) redirect('/beneficiary');

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Récupère le repas + cuisinière + livreuse
  const { data: meal } = await supabase
    .from('meals')
    .select(`
      id, date, type, status,
      cook:cook_id(id, name),
      driver:driver_id(id, name)
    `)
    .eq('id', meal_id)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (!meal) redirect('/beneficiary');

  // Vérifie que ce feedback n'existe pas déjà
  const { data: existing } = await supabase
    .from('feedbacks')
    .select('id')
    .eq('meal_id', meal_id)
    .eq('author_id', session.user.id)
    .maybeSingle();

  if (existing) redirect('/beneficiary');

  const cook   = meal.cook   as unknown as { id: string; name: string } | null;
  const driver = meal.driver as unknown as { id: string; name: string } | null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
         dir="rtl"
         style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full text-4xl mx-auto"
               style={{ backgroundColor: '#FBE4F0' }}>💛</div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#811453' }}>תודה על האמון!</h1>
          <p className="text-sm text-zinc-500">
            {new Date(meal.date as string).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <FeedbackForm
          mealId={meal_id}
          cook={cook}
          driver={driver}
        />
      </div>
    </div>
  );
}
