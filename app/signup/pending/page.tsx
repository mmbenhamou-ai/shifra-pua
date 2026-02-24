import Link from 'next/link';

export default function SignupPendingPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      dir="rtl"
      style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}
    >
      <div className="space-y-5 max-w-sm w-full">
        <div className="text-6xl">✅</div>

        <h1 className="text-2xl font-bold" style={{ color: '#811453' }}>
          הבקשה נשלחה!
        </h1>

        <p className="text-base leading-relaxed" style={{ color: '#4A0731' }}>
          תודה על ההרשמה.
          <br />
          הבקשה שלך נמצאת כעת אצל המנהלת לאישור.
          <br />
          תקבלי הודעה ברגע שזה מאושר.
        </p>

        <div
          className="rounded-2xl border p-4 text-right text-sm"
          style={{ borderColor: '#F7D4E2', backgroundColor: '#FFFFFF', color: '#7C365F' }}
        >
          <p className="font-semibold mb-1" style={{ color: '#811453' }}>
            מה קורה עכשיו?
          </p>
          <ul className="space-y-1 list-none">
            <li>• המנהלת תקבל התראה על הרשמתך</li>
            <li>• היא תאשר את הבקשה בהקדם</li>
            <li>• תקבלי SMS עם אישור ההרשמה</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="block min-h-[52px] w-full rounded-full pt-3 text-center text-sm font-semibold text-white transition"
          style={{ backgroundColor: '#811453' }}
        >
          חזרה לדף הכניסה
        </Link>
      </div>
    </div>
  );
}
