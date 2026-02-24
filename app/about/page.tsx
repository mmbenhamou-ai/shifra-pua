import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-10" dir="rtl"
         style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>
      <header className="w-full px-4 py-4 shadow-md" style={{ backgroundColor: '#811453' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="text-sm text-[#F7D4E2] active:opacity-70">← חזרה</Link>
          <h1 className="text-xl font-bold text-white">אודות שפרה פועה</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl"
               style={{ background: 'linear-gradient(135deg, #811453, #4A0731)' }}>
            <span className="text-white font-bold text-2xl">שפ</span>
          </div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#811453' }}>עמותת שפרה פועה</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            מחברות בין לבבות, מגשרות בין צרכים ומנות חמות
          </p>
        </div>

        {/* Mission */}
        <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
          <div className="bg-[#FBE4F0] px-5 py-3">
            <h3 className="font-bold text-right" style={{ color: '#811453' }}>🎯 המשימה שלנו</h3>
          </div>
          <div className="px-5 py-4 text-right">
            <p className="text-sm text-zinc-700 leading-relaxed">
              אנחנו מאמינות שכל אישה אחרי לידה זכאית לתמיכה, חמימות ומנוחה.
              עמותת שפרה פועה מארגנת מתנדבות מהקהילה — מבשלות ומחלקות — שמבשלות
              ומביאות ארוחות טריות לבתי היולדות מדי יום.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white shadow-sm">
          <div className="bg-[#FBE4F0] px-5 py-3">
            <h3 className="font-bold text-right" style={{ color: '#811453' }}>⚙️ איך זה עובד</h3>
          </div>
          <div className="divide-y divide-[#FBE4F0]">
            {[
              { emoji: '📝', title: 'הרשמה',     desc: 'יולדת, מבשלת או מחלקת נרשמות לאפליקציה' },
              { emoji: '✅', title: 'אישור',      desc: 'הרכזת מאשרת את ההרשמה ומתאמת' },
              { emoji: '🍲', title: 'בישול',      desc: 'מבשלת מתנדבת לוקחת ארוחה ומכינה עם אהבה' },
              { emoji: '🚗', title: 'חלוקה',      desc: 'מחלקת מגיעה לאסוף ומביאה ישירות לבית' },
              { emoji: '💛', title: 'הכרת תודה',  desc: 'היולדת מקבלת ארוחה חמה ומאשרת קבלה' },
            ].map((step) => (
              <div key={step.title} className="flex items-center gap-3 px-5 py-3.5 text-right">
                <span className="text-2xl">{step.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
                  <p className="text-xs text-zinc-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '🤝', label: 'קהילה' },
            { emoji: '💕', label: 'אהבה' },
            { emoji: '🍽️', label: 'תזונה' },
            { emoji: '✨', label: 'כבוד' },
          ].map((v) => (
            <div key={v.label}
                 className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#F7D4E2] bg-white py-5 shadow-sm">
              <span className="text-3xl">{v.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: '#811453' }}>{v.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/signup"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #811453, #4A0731)' }}>
            הצטרפי אלינו
          </Link>
          <Link href="/help"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border text-sm font-semibold"
                style={{ borderColor: '#F7D4E2', color: '#811453' }}>
            מרכז עזרה
          </Link>
        </div>
      </main>
    </div>
  );
}
