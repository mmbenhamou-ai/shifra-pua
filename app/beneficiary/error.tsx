'use client';

import { useEffect } from 'react';

export default function Error({
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
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-[#FDF2F8]">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FBE4F0]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1F2]">
          <span className="text-4xl">😔</span>
        </div>
        <h2 className="text-2xl font-black mb-3 text-[#BE185D]">אוי, משהו השתבש</h2>
        <p className="text-base text-zinc-500 mb-8 leading-relaxed">
          קרתה שגיאה לא צפויה בטעינת האזור שלך. נסי לרענן את העמוד.
        </p>
        <button
          onClick={reset}
          className="w-full py-4 bg-[#BE185D] text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 transition-all hover:bg-[#9D174D] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          רענני את העמוד ↻
        </button>
      </div>
    </div>
  );
}
