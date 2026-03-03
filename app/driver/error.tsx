'use client';

import { useEffect } from 'react';

export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-[#F0FDF4]">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#DCFCE7]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ECFDF5]">
          <span className="text-4xl">🚗</span>
        </div>
        <h2 className="text-2xl font-black mb-3 text-[#059669]">אוי, תקלה קטנה בשטח</h2>
        <p className="text-base text-zinc-500 mb-8 leading-relaxed">
          משהו השתבש בטעינת האזור שלך כמחלקת. אנא נסי לרענן.
        </p>
        <button
          onClick={reset}
          className="w-full py-4 bg-[#059669] text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all hover:bg-[#047857] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          נסי שוב ↻
        </button>
      </div>
    </div>
  );
}
