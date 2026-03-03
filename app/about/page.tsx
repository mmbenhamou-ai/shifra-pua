import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-10 bg-white text-[#403728]" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#91006A]/10">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="p-2 text-[#91006A] rounded-full hover:bg-[#91006A]/5">
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <h1 className="text-lg font-bold text-[#91006A]">אודות</h1>
          <button type="button" className="p-2 text-[#91006A]">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto w-full relative overflow-hidden">
        <div className="px-4 py-8 relative z-10">
          {/* Hero image block – Stitch */}
          <div className="mb-8 overflow-hidden shadow-2xl shadow-[#91006A]/20 aspect-[16/9] relative rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#91006A]/60 to-transparent flex items-end p-6">
              <h2 className="text-white text-3xl font-bold leading-tight">ארגון שפרה ופועה</h2>
            </div>
            <div className="w-full h-full bg-[#91006A]/10" />
          </div>

          <div className="space-y-6 text-slate-800 leading-relaxed text-lg">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-[#91006A] rounded-full" />
              <span className="text-[#91006A] font-bold tracking-wide uppercase text-sm">סיפור המעשה שלנו</span>
            </div>
            <p className="font-medium text-xl text-[#91006A]/90">
              ארגון שפרה ופועה נוסד בשנת תשל&quot;ז (1977) ביוזמת הרבי מליובאוויטש, מתוך חזון ללוות יולדות ולתמוך בהן בכל הנדרש – &quot;מחיתול ועד עגלה&quot;.
            </p>
            <div className="p-6 bg-[#91006A]/5 border-r-4 border-[#91006A] italic rounded-2xl">
              <p className="text-[#403728]">
                שם הארגון ניתן על שם שתי המיילדות העבריות במצרים, שפרה ופועה, שבמסירות נפש שמרו על חיי העם גם בתנאים קשים – ובזכותן זכינו להיגאל.
              </p>
            </div>
            <p className="text-[#403728]">
              מתוך החזון הזה נולד מיזם ארוחות הבוקר ליולדת: ארוחות מזינות, מושקעות וארוזות בקפידה, המוכנות על ידי מתנדבות מסורות ומובאות עד בית היולדת.
            </p>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="p-4 rounded-2xl bg-[#f8f5f8] border border-[#91006A]/20 text-center">
                <span className="material-symbols-outlined text-[#91006A] text-3xl mb-2 block">restaurant</span>
                <p className="text-sm font-bold text-[#403728]">ארוחות בוקר</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8f5f8] border border-[#91006A]/20 text-center">
                <span className="material-symbols-outlined text-[#91006A] text-3xl mb-2 block">volunteer_activism</span>
                <p className="text-sm font-bold text-[#403728]">תמיכה רגשית</p>
              </div>
            </div>
            <p className="text-[#403728]">
              כיום פועל המיזם ברחבי הארץ ובעולם, ולצידו מתקיימות גם סעודות שבת ליולדות ולמשפחותיהן.
            </p>
          </div>

          <div className="mt-12 mb-8 pt-8 border-t border-[#91006A]/10 flex flex-col items-center gap-4">
            <Link
              href="/donate"
              className="w-full bg-[#91006A] hover:bg-[#91006A]/90 text-white font-bold py-4 transition-all shadow-lg shadow-[#91006A]/25 flex items-center justify-center gap-2 rounded-lg"
            >
              <span className="material-symbols-outlined">favorite</span>
              תרומה לפעילות הארגון
            </Link>
            <Link
              href="/help"
              className="w-full bg-[#91006A]/10 text-[#91006A] font-bold py-4 border border-[#91006A]/20 hover:bg-[#91006A]/20 transition-all flex items-center justify-center gap-2 rounded-lg"
            >
              <span className="material-symbols-outlined">mail</span>
              צרי קשר איתנו
            </Link>
          </div>
        </div>
      </main>
      <footer className="sticky bottom-0 bg-[#f8f5f8] border-t border-[#91006A]/10 px-4 py-2">
        <nav className="flex justify-between items-center max-w-xl mx-auto">
          <Link href="/" className="flex flex-col items-center p-2 text-[#91006A]/60">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] mt-1">בית</span>
          </Link>
          <Link href="/donate" className="flex flex-col items-center p-2 text-[#91006A]/60">
            <span className="material-symbols-outlined">restaurant</span>
            <span className="text-[10px] mt-1">ארוחות</span>
          </Link>
          <Link href="/help" className="flex flex-col items-center p-2 text-[#91006A]/60">
            <span className="material-symbols-outlined">medical_services</span>
            <span className="text-[10px] mt-1">שירותים</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-[#91006A]/60">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] mt-1">פרופיל</span>
          </Link>
        </nav>
      </footer>
    </div>
  );
}
