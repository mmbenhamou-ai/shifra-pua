import Link from 'next/link';

const FAQ: { role: string; icon: string; color: string; items: { q: string; a: string }[] }[] = [
  {
    role: 'יולדת',
    icon: '👶',
    color: '#811453',
    items: [
      { q: 'איך נרשמים?', a: 'לוחצות על "הרשמה" בעמוד הכניסה, ממלאות את הפרטים (שם, טלפון, כתובת, שכונה) ובוחרות תפקיד "יולדת". מחכות לאישור המנהל.' },
      { q: 'מה זה "תאריך תחילה"?', a: 'התאריך ממנו מתחיל שירות הארוחות עבורכן. בדרך כלל יום הלידה או יום השחרור מבית החולים.' },
      { q: 'איך רואים את הארוחות שלי?', a: 'אחרי הכניסה לאפליקציה, מגיעים אוטומטית ללוח הארוחות האישי. שם מופיעות כל הארוחות המתוכננות עם הסטטוס שלהן.' },
      { q: 'מה המשמעות של הסטטוסים השונים?', a: '"פנויה" = ארוחה עוד לא הוקצתה למבשלת. "יש מבשלת" = מבשלת לקחה על עצמה להכין. "מוכנה לאיסוף" = המבשלת סיימה. "נמסר" = מחלקת הביאה. "אושר" = אתן אישרתן קבלה.' },
      { q: 'איך מאשרים קבלת ארוחה?', a: 'לחצו על כפתור "התקבל ✓" בכרטיס הארוחה המתאים. הכפתור מופיע רק כשהסטטוס הוא "נמסר".' },
      { q: 'מה עושים אם יש בעיה?', a: 'פנו ישירות לרכזת פרויקט שפרה פועה בטלפון.' },
    ],
  },
  {
    role: 'מבשלת',
    icon: '🍲',
    color: '#1E40AF',
    items: [
      { q: 'איך לוקחים ארוחה?', a: 'בדשבורד "ארוחות פנויות" מופיעות הארוחות הזמינות. לחצו על "לקחת ארוחה" בכרטיס הרצוי. הארוחה תהפוך לשלכן.' },
      { q: 'איך מסמנים שהארוחה מוכנה?', a: 'לאחר הכנת הארוחה, לחצו על "מוכן לאיסוף 🍽️" בכרטיס הארוחה בדשבורד "הארוחות שלי".' },
      { q: 'אפשר לראות את רשימת המנות?', a: 'כן, בכרטיס כל ארוחה מוצג שם התפריט ורשימת המנות המלאה.' },
      { q: 'מה אם שכחתי ולא יכולה להכין?', a: 'פנו לרכזת בהקדם כדי שיוכלו למצוא מבשלת אחרת.' },
      { q: 'מה המשמעות של "שבת"?', a: 'ארוחות שבת מחולקות לשני סוגים: "שבת ליל" (ארוחת ערב שישי) ו"שבת צהריים" (ארוחת צהריים שבת).' },
    ],
  },
  {
    role: 'מחלקת',
    icon: '🚗',
    color: '#065F46',
    items: [
      { q: 'איך לוקחים משלוח?', a: 'בדשבורד "משלוחים זמינים" מופיעות ארוחות מוכנות לאיסוף. לחצו על "לקחת משלוח" בכרטיס הרצוי.' },
      { q: 'איך מנווטים לכתובת?', a: 'בכל כרטיס ארוחה ישנם כפתורי ניווט ל-Waze וגוגל מפות שמובילים ישירות לכתובת היולדת.' },
      { q: 'איך מסמנים שאספנו?', a: 'לאחר איסוף הארוחה מהמבשלת, לחצו על "נאסף 📦" בכרטיס המשלוח.' },
      { q: 'איך מסמנים שמסרנו?', a: 'לאחר מסירה ליולדת, לחצו על "נמסר ✅". אחר כך על היולדת לאשר קבלה.' },
      { q: 'יש שעות מסירה מועדפות?', a: 'רצוי לתאם עם היולדת מראש. ניתן לתקשר דרך הטלפון שמוצג בכרטיס.' },
    ],
  },
  {
    role: 'מנהל',
    icon: '🛠️',
    color: '#7C365F',
    items: [
      { q: 'איך מאשרים הרשמה?', a: 'בדף "הרשמות" לחצו על "אשר" ליד הרשמה ממתינה. המערכת תיצור אוטומטית את כל הארוחות ליולדת.' },
      { q: 'איך מנהלים תפריטים?', a: 'בדף "תפריטים" ניתן ליצור תפריט חדש עם שם ורשימת מנות, להפעיל/לבטל תפריטים ולמחוק.' },
      { q: 'איך מוסיפים/מסדרים מנות בתפריט?', a: 'בכרטיס תפריט, השתמשו בחצים ↑↓ להזזת מנות ובכפתור הוספה להוסיף מנה חדשה.' },
      { q: 'איך רואים את כל הארוחות?', a: 'בדף "ארוחות" ניתן לסנן לפי תאריך, סטטוס וסוג, לשנות סטטוס ידנית ולהקצות מבשלת/מחלקת.' },
      { q: 'מה ה-webhooks?', a: 'אפשר לחבר n8n לנקודות הקצה /api/webhooks/* עם WEBHOOK_SECRET כדי לקבל התראות אוטומטיות לאירועי מערכת.' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen pb-10" dir="rtl" style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>
      <header className="w-full px-4 py-4 shadow-md" style={{ backgroundColor: '#811453' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="text-sm text-[#F7D4E2] active:opacity-70">← חזרה</Link>
          <h1 className="text-xl font-bold text-white">מרכז עזרה</h1>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 space-y-6">
        <p className="text-center text-sm text-zinc-600">שאלות נפוצות לכל תפקיד</p>

        {FAQ.map((section) => (
          <section key={section.role} className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#FBE4F0] px-4 py-3"
                 style={{ backgroundColor: section.color + '10' }}>
              <span className="text-xl">{section.icon}</span>
              <h2 className="text-base font-bold" style={{ color: section.color }}>{section.role}</h2>
            </div>
            <ul className="divide-y divide-[#FBE4F0]">
              {section.items.map((item, i) => (
                <li key={i} className="px-4 py-3 space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">❓ {item.q}</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{item.a}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="rounded-2xl border border-[#F7D4E2] bg-white px-4 py-4 text-center shadow-sm">
          <p className="text-sm font-semibold" style={{ color: '#811453' }}>עוד שאלות?</p>
          <p className="mt-1 text-sm text-zinc-600">פנו לרכזת הפרויקט</p>
        </div>
      </main>
    </div>
  );
}
