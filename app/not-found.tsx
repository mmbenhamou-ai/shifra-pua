import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <div className="space-y-6 max-w-sm w-full">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-4xl font-extrabold text-white shadow-lg"
          style={{ backgroundColor: '#811453' }}
        >
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>
            הדף לא נמצא
          </h1>
          <p className="text-base leading-relaxed" style={{ color: '#4A0731' }}>
            אופס! הדף שחיפשת לא קיים.
            <br />
            אולי הקישור שגוי או שהדף הוסר.
          </p>
        </div>

        <Link
          href="/"
          className="block min-h-[52px] w-full rounded-2xl pt-3 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
          style={{ backgroundColor: '#811453' }}
        >
          חזרה לדף הראשי ←
        </Link>

        <Link
          href="/login"
          className="block text-sm font-medium underline transition active:opacity-70"
          style={{ color: '#811453' }}
        >
          כניסה למערכת
        </Link>
      </div>
    </div>
  );
}
