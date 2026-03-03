import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
         dir="rtl"
         style={{ background: 'linear-gradient(135deg, #FFF7FB, #FBE4F0)' }}>
      <div className="space-y-6 max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
               style={{ backgroundColor: '#FBE4F0' }}>💛</div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>תודה רבה!</h1>
          <p className="text-base text-zinc-600 leading-relaxed">
            תקופת הארוחות שלך הסתיימה.<br />
            מאחלות לך ולמשפחתך בריאות, שמחה ואושר!
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#F7D4E2] px-5 py-4 text-right shadow-sm">
          <p className="text-sm text-zinc-700 leading-relaxed">
            היה כבוד גדול ללוות אותך בתקופה המיוחדת הזו.
            אנחנו תמיד כאן אם תזדקקי לנו שוב 🤍
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/beneficiary"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--brand)' }}>
            חזרה לדשבורד
          </Link>
          <Link href="/donate"
                className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border text-sm font-semibold"
                style={{ borderColor: '#F7D4E2', color: 'var(--brand)' }}>
            💛 תרמי לעמותה
          </Link>
        </div>
      </div>
    </div>
  );
}
