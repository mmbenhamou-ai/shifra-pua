import { redirect } from 'next/navigation';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import Link from 'next/link';

export default async function Home() {
  const { session, user } = await getSessionOrDevBypass();

  // Si l'utilisateur est connecté et approuvé, le rediriger
  if (session && user) {
    if (!user.approved) redirect('/signup/pending');
    switch (user.role) {
      case 'admin': redirect('/admin');
      case 'beneficiary': redirect('/beneficiary');
      case 'cook': redirect('/cook');
      case 'driver': redirect('/driver');
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-[#91006A]/20">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-[#91006A]/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-[#91006A] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">favorite</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#91006A]">שפרה ופועה</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-[#91006A] hover:bg-[#91006A]/5 px-4 py-2 rounded-full transition-colors"
          >
            התחברות
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <section className="px-6 py-16 text-center max-w-3xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
          <h1 className="text-4xl md:text-5xl font-black text-[#403728] leading-[1.1] tracking-tight text-balance">
            מערכת ניהול ארוחות ליולדות בירושלים
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto font-medium text-balance leading-relaxed">
            קהילת נשים מתנדבות המבשלות ומחלקות ארוחות חמות ומזינות לאמהות שזה עתה ילדו, באהבה מכל הלב.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href="/signup?type=beneficiary"
              className="w-full sm:w-auto px-8 py-4 bg-[#91006A] text-white rounded-2xl font-bold shadow-lg shadow-[#91006A]/25 hover:bg-[#7a0059] transition-all hover:-translate-y-0.5"
            >
              ילדתי / אני בהריון 👶
            </Link>
            <Link
              href="/signup?type=volunteer"
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#91006A] rounded-2xl font-bold shadow-sm border-2 border-[#91006A]/20 hover:bg-[#91006A]/5 transition-all hover:-translate-y-0.5"
            >
              אני רוצה להתנדב ❤️
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#91006A]/5 flex flex-col items-center text-center space-y-4">
            <div className="size-14 rounded-2xl bg-[#FFE4E6] text-[#BE185D] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">soup_kitchen</span>
            </div>
            <h3 className="font-bold text-lg text-[#403728]">מבשלות</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              נשים שמבשלות בביתן ארוחות חמות, טריות ובריאות עבור היולדות.
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#91006A]/5 flex flex-col items-center text-center space-y-4">
            <div className="size-14 rounded-2xl bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <h3 className="font-bold text-lg text-[#403728]">מחלקות</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              מתנדבות שאוספות את האוכל החם ומביאות אותו עד פתח הדלת של היולדת באהבה.
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#91006A]/5 flex flex-col items-center text-center space-y-4">
            <div className="size-14 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">pregnant_woman</span>
            </div>
            <h3 className="font-bold text-lg text-[#403728]">יולדות</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              מקבלות מעטפת תמיכה חמה כדי שיוכלו לנוח, להחלים ולהתמקד ברך הנולד בשלווה.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="material-symbols-outlined text-rose-500">favorite</span>
          </div>
          <p className="text-slate-500 font-medium">ביחד אנחנו חזקות - שפרה ופועה</p>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}
