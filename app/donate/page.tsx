import Link from 'next/link';

export default function DonatePage() {
  return (
    <div className="min-h-screen pb-10" dir="rtl"
         style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>
      <header className="w-full px-4 py-4 shadow-md" style={{ backgroundColor: '#811453' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="text-sm text-[#F7D4E2]">← חזרה</Link>
          <h1 className="text-xl font-bold text-white">תמכי בנו</h1>
          <span className="w-12" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-8 space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FBE4F0] text-4xl">💛</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#811453' }}>עזרי לנו להמשיך</h2>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
            כל תרומה מאפשרת לנו לספק עוד ארוחות לעוד יולדות בקהילה.
            תודה שאת שותפה במסע שלנו!
          </p>
        </div>

        <div className="space-y-3">
          <a href="https://www.jgive.com" target="_blank" rel="noopener noreferrer"
             className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg"
             style={{ background: 'linear-gradient(135deg, #811453, #4A0731)' }}>
            <span>💳</span> תרומה מקוונת
          </a>
          <a href="https://wa.me/972501234567" target="_blank" rel="noopener noreferrer"
             className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold"
             style={{ borderColor: '#25D366', color: '#128C7E', backgroundColor: '#F0FFF4' }}>
            <span>📱</span> צרי קשר בוואצאפ
          </a>
        </div>

        <div className="rounded-2xl border border-[#F7D4E2] bg-white px-5 py-4 text-right">
          <h3 className="font-bold text-sm mb-2" style={{ color: '#811453' }}>למה לתרום?</h3>
          <ul className="space-y-1.5 text-sm text-zinc-600">
            <li>🍽️ כל 50₪ = ארוחה שלמה ליולדת</li>
            <li>💕 כל 200₪ = שבוע של ארוחות בוקר</li>
            <li>🌟 כל 1,000₪ = שבועיים של תמיכה מלאה</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
