'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div dir="rtl" className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">שגיאת מערכת</h2>
        <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-50 p-2 rounded truncate" dir="ltr">
          {error.digest || error.message || 'Unknown error'}
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium transition hover:bg-gray-800"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
