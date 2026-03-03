'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-pale">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-border">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-brand mb-2">משהו השתבש</h2>
        <p className="text-sm text-gray-500 mb-6">
          אירעה שגיאה לא צפויה. אנא נסי שוב.
        </p>
        <button
          onClick={reset}
          className="w-full py-3 bg-brand text-white rounded-xl font-semibold transition hover:opacity-90 active:scale-[0.98]"
        >
          נסי שוב
        </button>
      </div>
    </div>
  );
}
