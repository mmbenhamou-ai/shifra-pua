import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import Link from 'next/link';

export default async function VolunteerDashboardPage() {
  const { session, user } = await getSessionOrDevBypass();
  if (!session) redirect('/login');
  if (!user) redirect('/signup/pending');

  const canCook =
    user.role === 'cook' || user.role === 'both' || user.role === 'admin';
  const canDeliver =
    user.role === 'driver' || user.role === 'both' || user.role === 'admin';

  return (
    <div className="min-h-screen bg-[#FFF7FB] px-4 pt-4 pb-20" dir="rtl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-[#91006A]">לוח מתנדבות</h1>
        <p className="text-sm text-slate-600 mt-1">
          כאן תוכלי לבחור אם לבשל או לחלק ארוחות.
        </p>
      </header>

      <div className="space-y-4">
        {canCook && (
          <Link
            href="/cook"
            className="block rounded-2xl bg-white border border-[#F7D4E2] px-4 py-3 shadow-sm active:scale-[0.98] transition"
          >
            <p className="text-sm font-semibold text-right text-[#91006A]">
              לוח מבשלות
            </p>
            <p className="text-xs text-right text-slate-600 mt-1">
              ראיית ארוחות פנויות לבישול והארוחות שלקחת על עצמך.
            </p>
          </Link>
        )}

        {canDeliver && (
          <Link
            href="/driver"
            className="block rounded-2xl bg-white border border-[#F7D4E2] px-4 py-3 shadow-sm active:scale-[0.98] transition"
          >
            <p className="text-sm font-semibold text-right text-[#91006A]">
              לוח מחלקות
            </p>
            <p className="text-xs text-right text-slate-600 mt-1">
              ראיית משלוחים זמינים והמשלוחים שבדרך אל היולדות.
            </p>
          </Link>
        )}

        {!canCook && !canDeliver && (
          <p className="text-sm text-right text-slate-500">
            לתפקידך הנוכחי אין לוח מתנדבות. אם יש בעיה בהרשמה, פני למנהלת
            המערכת.
          </p>
        )}
      </div>
    </div>
  );
}

