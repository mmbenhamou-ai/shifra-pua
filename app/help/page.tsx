import Link from 'next/link';
import { ArrowRight, Route, HelpCircle, Headset } from 'lucide-react';
import { getSessionOrDevBypass } from '@/lib/auth-dev';
import { redirect } from 'next/navigation';

const FAQS_BY_ROLE: Record<string, { title: string; steps: { title: string; desc: string; icon: string }[]; qas: { q: string; a: string }[] }> = {
  beneficiary: {
    title: 'מדריך ליולדת',
    steps: [
      { title: 'מקבלת אישור', desc: 'אחרי ההרשמה, המנהלת תאשר אותך והארוחות שלך ייווצרו אוטומטית.', icon: 'check_circle' },
      { title: 'מתנדבת לוקחת', desc: 'מבשלת תיקח את הארוחה ותתחיל להכין אותה באהבה.', icon: 'soup_kitchen' },
      { title: 'משלוח בדרך', desc: 'מחלקת תאשף את הארוחה ותביא אותה עד לפתח ביתך.', icon: 'local_shipping' },
      { title: 'בתאבון!', desc: 'קבלי את הארוחה, אשרי קבלה באפליקציה, ונוחי.', icon: 'restaurant' },
    ],
    qas: [
      { q: 'איך רואים מי מכינה לי את הארוחה?', a: 'בדף הראשי "הארוחות שלי" תוכלי לראות מי המבשלת והמחלקת ברגע שהן ייקחו את המשמרת.' },
      { q: 'מה קורה אם אני צריכה לבטל?', a: 'אם אינך צריכה ארוחה ביום מסוים, אנא עדכני את המנהלת בוואטסאפ מוקדם ככל האפשר.' },
      { q: 'איך אני מעדכנת אלרגיות?', a: 'היכנסי לעמוד הפרופיל שלך (סמל האיש למטה) ועדכני את ההערות/אלרגיות. המידע יועבר למבשלת.' },
    ],
  },
  cook: {
    title: 'מדריך למבשלת',
    steps: [
      { title: 'בוחרת ארוחה', desc: 'כנסי ל"ארוחות פנויות" וקחי ארוחה ביום שנוח לך.', icon: 'calendar_month' },
      { title: 'מבשלת באהבה', desc: 'הכיני את הארוחה לפי התפריט המבוקש. שימי לב להערות ולאלרגיות.', icon: 'cooking' },
      { title: 'מוכנה לאיסוף', desc: 'סיימת? לחצי על "מוכנה לאיסוף" כדי שהמחלקת תדע לבוא.', icon: 'done_all' },
      { title: 'מסירה למחלקת', desc: 'מסרי את הארוחה הארוזה למחלקת שתגיע אלייך.', icon: 'volunteer_activism' },
    ],
    qas: [
      { q: 'איך אני יודעת מתי המחלקת מגיעה?', a: 'המחלקת תיצור איתך קשר. תוכלי גם לראות את פרטיה בכרטיס הארוחה תחת "הארוחות שלי".' },
      { q: 'לקחתי ארוחה ואני לא יכולה לבשל בסוף, מה לעשות?', a: 'צרי קשר דחוף עם המנהלת בוואטסאפ כדי שנוכל למצוא מחליפה ולא נשאיר את היולדת בלי אוכל.' },
      { q: 'באילו כלים להשתמש?', a: 'השתמשי בכלים חד פעמיים אסתטיים. ניתן לקבל מארזים דרך העמותה.' },
    ],
  },
  driver: {
    title: 'מדריך למחלקת',
    steps: [
      { title: 'לוקחת משלוח', desc: 'בחרי משלוח מ"משלוחים פנויים" שמתאים לאזור שלך.', icon: 'map' },
      { title: 'איסוף מהמבשלת', desc: 'סעי לבית המבשלת לאסוף את הארוחה. לחצי "נאסף".', icon: 'takeout_dining' },
      { title: 'משלוח ליולדת', desc: 'נווטי לבית היולדת (יש כפתור ווייז) ומסרי לה את האוכל.', icon: 'directions_car' },
      { title: 'סיום מסירה', desc: 'לחצי על "נמסר" כדי לעדכן את המערכת שהאוכל הגיע ליעדו.', icon: 'task_alt' },
    ],
    qas: [
      { q: 'איך אני מנווטת לכתובות?', a: 'בכרטיס המשלוח ישנם כפתורי ניווט אוטומטיים ל-Waze ול-Google Maps.' },
      { q: 'היולדת לא עונה, מה לעשות?', a: 'השאירי את האוכל ליד הדלת במקום בטוח, סמני "נמסר" ושלחי לה הודעת וואטסאפ שהאוכל מחכה לה.' },
      { q: 'לקחתי משלוח ואני תקועה, מה עושים?', a: 'פני מיד למנהלת בוואטסאפ כדי שנוכל להקפיץ מחלקת חלופית.' },
    ],
  },
  admin: {
    title: 'מדריך למנהלת',
    steps: [
      { title: 'ניהול הרשמות', desc: 'אשרי משתמשות חדשות דרך "הרשמות ממתינות".', icon: 'how_to_reg' },
      { title: 'מעקב ארוחות', desc: 'עקבי אחרי ארוחות חסרות במסך "ארוחות" ושבצי מתנדבות לפי צורך.', icon: 'dashboard' },
      { title: 'ניהול תפריטים', desc: 'עדכני תפריטים עונתיים במערכת דרך כרטיסיית תפריטים.', icon: 'restaurant_menu' },
    ],
    qas: [
      { q: 'איך אני מייצאת נתונים?', a: 'דרך דף ההגדרות או הסטטיסטיקות תוכלי לייצא מסמכי CSV.' },
      { q: 'מה קורה אם ארוחה לא משובצת בזמן?', a: 'במידה והוגדר כך, המערכת תשלח התראה דרך נתיבי הוואטסאפ וה-n8n.' },
    ],
  }
};

export default async function HelpPage() {
  const { session, user } = await getSessionOrDevBypass();

  if (!session || !user) {
    redirect('/login');
  }

  const roleData = FAQS_BY_ROLE[user.role] || FAQS_BY_ROLE.beneficiary;

  const backHref = user.role === 'admin' ? '/admin'
    : user.role === 'cook' ? '/cook'
      : user.role === 'driver' ? '/driver'
        : '/beneficiary';

  return (
    <div className="min-h-screen bg-[#f8f5f8] pb-24 font-sans text-[#403728]" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-[#91006A]/10 px-4 h-16 flex items-center justify-between">
        <Link href={backHref} className="text-[#91006A] p-2 hover:bg-[#91006A]/5 rounded-full transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-extrabold text-[#91006A]">{roleData.title}</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-10 animate-[fadeIn_0.5s_ease-out]">

        {/* זרימת עבודה / איך זה עובד */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Route className="text-[#91006A] text-2xl" />
            <h2 className="text-xl font-bold text-[#403728]">איך זה עובד?</h2>
          </div>

          <div className="relative border-r-2 border-[#91006A]/20 pr-6 space-y-8">
            {roleData.steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -right-[35px] top-1 bg-white border-2 border-[#91006A] text-[#91006A] size-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                  {idx + 1}
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#91006A]/5 ml-2">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-[#403728] text-lg">{step.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* שאלות נפוצות */}
        <section className="space-y-4 pt-4 border-t border-[#91006A]/10">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="text-[#91006A] text-2xl" />
            <h2 className="text-xl font-bold text-[#403728]">שאלות נפוצות</h2>
          </div>

          <div className="space-y-4">
            {roleData.qas.map((qa, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-[#91006A]/5">
                <div className="flex gap-3 mb-2">
                  <span className="text-[#91006A] font-black text-lg">ש:</span>
                  <h3 className="font-bold text-[#403728] leading-tight mt-0.5">{qa.q}</h3>
                </div>
                <div className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                  <span className="text-slate-400 font-bold text-lg">ת:</span>
                  <p className="mt-0.5">{qa.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* יצירת קשר */}
        <section className="pt-6">
          <div className="bg-gradient-to-br from-[#91006A] to-[#7a0059] rounded-3xl p-6 text-white text-center shadow-xl shadow-[#91006A]/20 relative overflow-hidden">
            <Headset className="absolute -left-4 -bottom-4 text-[120px] text-white/5 rotate-12 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="size-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/30">
                <Headset className="text-3xl" />
              </div>
              <h3 className="font-bold text-xl mb-2">צריכה עזרה נוספת?</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed text-balance">
                אנחנו כאן לכל שאלה, תקלה או בעיה. אל תהססי לפנות למנהלת הפרויקט.
              </p>

              <a
                href="https://wa.me/9725XXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-[#91006A] font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current border-[#91006A]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span dir="ltr">05X-XXXX-XXX</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
