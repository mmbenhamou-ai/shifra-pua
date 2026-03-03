'use client';

import { useEffect } from 'react';

export default function CookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-[#FFFBEB]">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FEF3C7]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF7ED]">
          <span className="text-4xl">👩‍🍳</span>
        </div>
        <h2 className="text-2xl font-black mb-3 text-[#D97706]">משהו השתבש</h2>
        <p className="text-base text-zinc-500 mb-8 leading-relaxed">
          אירעה שגיאה בטעינת האזור שלך כמבשלת. אנא נסי לרענן.
        </p>
        <button
          onClick={reset}
          className="w-full py-4 bg-[#D97706] text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-200 transition-all hover:bg-[#B45309] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          נסי שוב ↻
        </button>
      </div>
    </div>
  );
}
