'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
         dir="rtl"
         style={{ background: 'linear-gradient(135deg, #FFF7FB, #FBE4F0)' }}>
      <div className="space-y-5 max-w-xs">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FBE4F0] text-5xl">📵</div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand)' }}>אין חיבור לאינטרנט</h1>
        <p className="text-base text-zinc-600 leading-relaxed">
          נראה שאת לא מחוברת לאינטרנט כרגע.<br />
          בדקי את החיבור ונסי שוב.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full min-h-[52px] rounded-2xl text-base font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--brand), #4A0731)' }}
        >
          נסי שוב
        </button>
      </div>
    </div>
  );
}
