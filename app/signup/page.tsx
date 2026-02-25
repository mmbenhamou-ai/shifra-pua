'use client';

import { useState, useCallback } from 'react';
import { registerUser } from './actions';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'beneficiary' | 'cook' | 'driver';

interface BeneficiaryData {
  // Step 2 — infos perso
  name: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  // Step 3 — foyer
  num_adults: string;
  num_children: string;
  // Step 4 — préférences alimentaires
  is_vegetarian: boolean;
  spicy_level: string;
  cooking_notes: string;
  // Step 5 — petits-déjeuners
  birth_date: string;
  start_date: string;
  // Step 6 — Shabbat
  shabbat_friday: boolean;
  shabbat_saturday: boolean;
  shabbat_kashrut: string;
}

const EMPTY: BeneficiaryData = {
  name: '', phone: '', email: '', address: '', neighborhood: '',
  num_adults: '2', num_children: '0',
  is_vegetarian: false, spicy_level: '0', cooking_notes: '',
  birth_date: '', start_date: '',
  shabbat_friday: false, shabbat_saturday: false, shabbat_kashrut: 'רגיל',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLES = [
  { key: 'beneficiary' as Role, label: 'יולדת',  desc: 'אני זקוקה לארוחות לאחר הלידה',  emoji: '👶' },
  { key: 'cook'        as Role, label: 'מבשלת',  desc: 'אני רוצה לבשל ארוחות למשפחות',  emoji: '🍲' },
  { key: 'driver'      as Role, label: 'מחלקת',  desc: 'אני רוצה לחלק ארוחות',           emoji: '🚗' },
];

const KASHRUT_OPTIONS = ['רגיל', 'חלק', 'מהדרין', 'בד"ץ'];

const TOTAL_BENEFICIARY_STEPS = 7;

function validatePhone(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  return /^05\d{8}$/.test(d) || /^9725\d{8}$/.test(d);
}

function inputCls(err: boolean) {
  return [
    'w-full rounded-xl border px-3 py-3 text-right text-sm text-zinc-900 bg-white',
    'placeholder:text-gray-400 focus:outline-none focus:ring-2',
    err ? 'border-red-400 focus:ring-red-300' : 'border-[#F7D4E2] focus:ring-[#811453]',
  ].join(' ');
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      {children}
    </div>
  );
}

function Err({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / (total - 1)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: '#7C365F' }}>
        <span>שלב {step} מתוך {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#FBE4F0]">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: '#811453' }}
        />
      </div>
    </div>
  );
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────

function NavButtons({
  onBack, onNext, nextLabel = 'הבא →', nextDisabled = false, pending = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button type="button" onClick={onBack}
          className="min-h-[52px] flex-1 rounded-full border text-sm font-semibold transition"
          style={{ borderColor: '#F7D4E2', color: '#811453', backgroundColor: '#fff' }}>
          ← חזרה
        </button>
      )}
      <button
        type={onNext ? 'button' : 'submit'}
        onClick={onNext}
        disabled={nextDisabled || pending}
        className="min-h-[52px] flex-[2] rounded-full text-sm font-semibold text-white transition disabled:opacity-40"
        style={{ backgroundColor: '#811453' }}>
        {pending ? 'שולחת...' : nextLabel}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SignupPage() {
  const [role,    setRole]    = useState<Role | null>(null);
  const [step,    setStep]    = useState(1);           // 1 = choix rôle
  const [data,    setData]    = useState<BeneficiaryData>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // simple cook/driver form values
  const [cvName,   setCvName]   = useState('');
  const [cvPhone,  setCvPhone]  = useState('');
  const [cvAddr,   setCvAddr]   = useState('');
  const [cvNeigh,  setCvNeigh]  = useState('');
  const [cvHasCar, setCvHasCar] = useState('false');

  const set = (k: keyof BeneficiaryData, v: string | boolean) =>
    setData((p) => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  // ── Validators ──
  const phoneErr = useCallback(() => {
    if (!touched.phone) return null;
    if (!data.phone.trim()) return 'מספר טלפון הוא שדה חובה';
    if (!validatePhone(data.phone)) return 'נא להזין מספר ישראלי תקין (050-1234567)';
    return null;
  }, [touched.phone, data.phone]);

  const cvPhoneErr = useCallback(() => {
    if (!touched.cvPhone) return null;
    if (!cvPhone.trim()) return 'מספר טלפון הוא שדה חובה';
    if (!validatePhone(cvPhone)) return 'נא להזין מספר ישראלי תקין (050-1234567)';
    return null;
  }, [touched.cvPhone, cvPhone]);

  const today = new Date().toISOString().split('T')[0];

  // ── Steps validity ──
  function step2Valid() {
    return data.name.trim().length >= 2 && validatePhone(data.phone) && data.address.trim().length > 0;
  }
  function step3Valid() {
    return parseInt(data.num_adults) >= 1;
  }
  function step5Valid() {
    return !!data.start_date && data.start_date >= today;
  }
  function step6Valid() {
    return data.shabbat_friday || data.shabbat_saturday;
  }

  // ── Submit beneficiary ──
  async function submitBeneficiary() {
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.append('role',             'beneficiary');
      fd.append('name',             data.name);
      fd.append('phone',            data.phone);
      fd.append('email',            data.email);
      fd.append('address',          data.address);
      fd.append('neighborhood',     data.neighborhood);
      fd.append('birth_date',       data.birth_date);
      fd.append('start_date',       data.start_date);
      fd.append('num_adults',       data.num_adults);
      fd.append('num_children',     data.num_children);
      fd.append('is_vegetarian',    data.is_vegetarian ? 'true' : 'false');
      fd.append('spicy_level',      data.spicy_level);
      fd.append('cooking_notes',    data.cooking_notes);
      fd.append('shabbat_friday',   data.shabbat_friday   ? 'true' : 'false');
      fd.append('shabbat_saturday', data.shabbat_saturday ? 'true' : 'false');
      fd.append('shabbat_kashrut',  data.shabbat_kashrut);
      await registerUser(fd);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      setPending(false);
    }
  }

  // ── Submit cook/driver ──
  async function submitVolunteer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ cvPhone: true });
    if (!cvName.trim() || !validatePhone(cvPhone)) return;
    setError(null);
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      await registerUser(fd);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      setPending(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" dir="rtl"
         style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>

      <header className="w-full px-4 py-3 shadow-md" style={{ backgroundColor: '#811453' }}>
        <h1 className="text-xl font-bold text-white text-right">שפרה פועה — הרשמה</h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 space-y-6">

        {/* ── STEP 1 — choix du rôle ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1 text-right">
              <h2 className="text-xl font-bold" style={{ color: '#811453' }}>מי את?</h2>
              <p className="text-sm text-zinc-500">בחרי את תפקידך במערכת</p>
            </div>
            <div className="flex flex-col gap-3">
              {ROLES.map((r) => (
                <button key={r.key} type="button" onClick={() => setRole(r.key)}
                  className="flex items-center justify-between rounded-2xl border-2 p-4 text-right transition active:scale-[0.99]"
                  style={{
                    borderColor:     role === r.key ? '#811453' : '#F7D4E2',
                    backgroundColor: role === r.key ? '#FFF7FB' : '#FFFFFF',
                  }}>
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-base font-semibold text-zinc-900">{r.label}</span>
                    <span className="text-xs text-zinc-500">{r.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <NavButtons
              nextLabel="המשך ←"
              nextDisabled={!role}
              onNext={() => setStep(role === 'beneficiary' ? 2 : 10)}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            WIZARD יולדת — étapes 2–7
        ══════════════════════════════════════════════════════════════════════ */}

        {role === 'beneficiary' && step >= 2 && step <= 7 && (
          <ProgressBar step={step - 1} total={TOTAL_BENEFICIARY_STEPS - 1} />
        )}

        {/* ── STEP 2 — infos personnelles ── */}
        {role === 'beneficiary' && step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>פרטים אישיים</h2>

            <Field label="שם מלא *">
              <input value={data.name} onChange={(e) => set('name', e.target.value)}
                onBlur={() => touch('name')} placeholder="שם פרטי ושם משפחה"
                className={inputCls(!!(touched.name && data.name.trim().length < 2))} />
              <Err msg={touched.name && data.name.trim().length < 2 ? 'שם חייב להכיל לפחות 2 תווים' : null} />
            </Field>

            <Field label="מספר טלפון *">
              <input value={data.phone} onChange={(e) => set('phone', e.target.value)}
                onBlur={() => touch('phone')} placeholder="050-1234567"
                type="tel" dir="ltr" className={inputCls(!!phoneErr())} />
              {phoneErr()
                ? <Err msg={phoneErr()} />
                : touched.phone && validatePhone(data.phone)
                  ? <p className="mt-1 text-xs font-medium text-green-600">✓ מספר תקין</p>
                  : null}
            </Field>

            <Field label="כתובת מגורים *">
              <input value={data.address} onChange={(e) => set('address', e.target.value)}
                onBlur={() => touch('address')} placeholder="רחוב, מספר, עיר"
                className={inputCls(!!(touched.address && !data.address.trim()))} />
              <Err msg={touched.address && !data.address.trim() ? 'כתובת היא שדה חובה' : null} />
            </Field>

            <Field label="שכונה">
              <input value={data.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}
                placeholder="שכונה / אזור (אופציונלי)" className={inputCls(false)} />
            </Field>

            <Field label="אימייל (אופציונלי)">
              <input type="email" dir="ltr" value={data.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="example@gmail.com" className={inputCls(false)} />
              <p className="mt-1 text-xs text-zinc-400 text-right">לא חובה — לקבלת עדכונים במייל</p>
            </Field>

            <Field label="תאריך לידת התינוק/ת">
              <input type="date" dir="ltr" value={data.birth_date}
                onChange={(e) => set('birth_date', e.target.value)} className={inputCls(false)} />
            </Field>

            <NavButtons onBack={() => setStep(1)} onNext={() => { setTouched({ name: true, phone: true, address: true }); if (step2Valid()) setStep(3); }} nextDisabled={!step2Valid()} />
          </div>
        )}

        {/* ── STEP 3 — composition du foyer ── */}
        {role === 'beneficiary' && step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>הרכב המשפחה</h2>
            <p className="text-sm text-zinc-500 text-right">כדי לדעת כמה מנות להכין</p>

            <Field label="מספר מבוגרים *">
              <input type="number" min="1" max="10" dir="ltr"
                value={data.num_adults} onChange={(e) => set('num_adults', e.target.value)}
                className={inputCls(false)} />
            </Field>

            <Field label="מספר ילדים">
              <input type="number" min="0" max="15" dir="ltr"
                value={data.num_children} onChange={(e) => set('num_children', e.target.value)}
                className={inputCls(false)} />
            </Field>

            <NavButtons onBack={() => setStep(2)} onNext={() => { if (step3Valid()) setStep(4); }} nextDisabled={!step3Valid()} />
          </div>
        )}

        {/* ── STEP 4 — préférences alimentaires ── */}
        {role === 'beneficiary' && step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>העדפות אכילה</h2>

            {/* Végétarien */}
            <button type="button"
              onClick={() => set('is_vegetarian', !data.is_vegetarian)}
              className="flex w-full items-center justify-between rounded-2xl border-2 p-4 transition"
              style={{
                borderColor:     data.is_vegetarian ? '#811453' : '#F7D4E2',
                backgroundColor: data.is_vegetarian ? '#FFF7FB' : '#fff',
              }}>
              <span className="text-2xl">🥗</span>
              <div className="text-right">
                <p className="font-semibold text-zinc-900">צמחוני</p>
                <p className="text-xs text-zinc-500">ללא בשר ועוף</p>
              </div>
            </button>

            {/* Épices */}
            <div className="space-y-2 text-right">
              <p className="text-sm font-medium text-zinc-800">רמת חריפות</p>
              <div className="flex gap-2">
                {[
                  { val: '0', label: 'לא חריף 😌' },
                  { val: '1', label: 'קצת 🌶' },
                  { val: '2', label: 'חריף 🔥' },
                ].map((opt) => (
                  <button key={opt.val} type="button"
                    onClick={() => set('spicy_level', opt.val)}
                    className="flex-1 rounded-full py-2 text-sm font-medium transition"
                    style={{
                      backgroundColor: data.spicy_level === opt.val ? '#811453' : '#FBE4F0',
                      color:           data.spicy_level === opt.val ? '#fff'    : '#811453',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes cuisine */}
            <Field label="הערות למטבח (אלרגיות, הגבלות...)">
              <textarea value={data.cooking_notes}
                onChange={(e) => set('cooking_notes', e.target.value)}
                placeholder="לדוגמה: ללא כמון, ללא פלפל שחור, אלרגיה לאגוזים"
                rows={3}
                className={inputCls(false) + ' resize-none'} />
            </Field>

            <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} />
          </div>
        )}

        {/* ── STEP 5 — petits-déjeuners (dates) ── */}
        {role === 'beneficiary' && step === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>ארוחות בוקר</h2>
            <p className="text-sm text-zinc-500 text-right">
              תקבלי ארוחת בוקר כל יום לאחר האישור. בחרי מאיזה תאריך להתחיל.
            </p>

            <Field label="תאריך התחלה *">
              <input type="date" dir="ltr" min={today}
                value={data.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                onBlur={() => touch('start_date')}
                className={inputCls(!!(touched.start_date && !step5Valid()))} />
              <Err msg={touched.start_date && !data.start_date ? 'נא לבחור תאריך התחלה' : null} />
              {data.start_date && (
                <p className="mt-1 text-xs text-zinc-400">
                  ×14 ימים עד {new Date(new Date(data.start_date).getTime() + 14 * 86400000).toLocaleDateString('he-IL')}
                </p>
              )}
            </Field>

            <NavButtons onBack={() => setStep(4)} onNext={() => { touch('start_date'); if (step5Valid()) setStep(6); }} nextDisabled={!step5Valid()} />
          </div>
        )}

        {/* ── STEP 6 — Shabbat ── */}
        {role === 'beneficiary' && step === 6 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>ארוחות שבת</h2>
            <p className="text-sm text-zinc-500 text-right">בחרי אילו ארוחות שבת תרצי לקבל</p>

            {[
              { key: 'shabbat_friday'   as const, label: 'ליל שבת (יום שישי)',  emoji: '🕯️' },
              { key: 'shabbat_saturday' as const, label: 'שבת צהריים',          emoji: '☀️' },
            ].map((opt) => (
              <button key={opt.key} type="button"
                onClick={() => set(opt.key, !data[opt.key])}
                className="flex w-full items-center justify-between rounded-2xl border-2 p-4 transition"
                style={{
                  borderColor:     data[opt.key] ? '#811453' : '#F7D4E2',
                  backgroundColor: data[opt.key] ? '#FFF7FB' : '#fff',
                }}>
                <span className="text-2xl">{opt.emoji}</span>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-zinc-900">{opt.label}</p>
                  {data[opt.key] && <span className="text-[#811453] text-xl">✓</span>}
                </div>
              </button>
            ))}

            {/* Kashrut */}
            <div className="space-y-2 text-right">
              <p className="text-sm font-medium text-zinc-800">כשרות</p>
              <div className="grid grid-cols-2 gap-2">
                {KASHRUT_OPTIONS.map((k) => (
                  <button key={k} type="button"
                    onClick={() => set('shabbat_kashrut', k)}
                    className="rounded-full py-2 text-sm font-medium transition"
                    style={{
                      backgroundColor: data.shabbat_kashrut === k ? '#811453' : '#FBE4F0',
                      color:           data.shabbat_kashrut === k ? '#fff'    : '#811453',
                    }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <NavButtons onBack={() => setStep(5)} onNext={() => { if (step6Valid()) setStep(7); }} nextDisabled={!step6Valid()} />
          </div>
        )}

        {/* ── STEP 7 — récapitulatif + confirmation ── */}
        {role === 'beneficiary' && step === 7 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>סיכום הרשמה</h2>
            <p className="text-sm text-zinc-500 text-right">בדקי שהפרטים נכונים לפני השליחה</p>

            <div className="rounded-2xl border border-[#F7D4E2] bg-white divide-y divide-[#FBE4F0] text-right text-sm">
              <Row label="שם"          value={data.name} />
              <Row label="טלפון"       value={data.phone} />
              {data.email && <Row label="אימייל" value={data.email} />}
              <Row label="כתובת"       value={[data.address, data.neighborhood].filter(Boolean).join(' · ')} />
              <Row label="הרכב"        value={`${data.num_adults} מבוגרים, ${data.num_children} ילדים`} />
              <Row label="תזונה"       value={data.is_vegetarian ? 'צמחוני' : 'רגיל'} />
              <Row label="חריפות"      value={['לא חריף', 'קצת חריף', 'חריף'][parseInt(data.spicy_level)]} />
              {data.cooking_notes && <Row label="הערות" value={data.cooking_notes} />}
              <Row label="התחלה"       value={data.start_date ? new Date(data.start_date).toLocaleDateString('he-IL') : '—'} />
              <Row label="שבת"         value={[data.shabbat_friday && 'ליל שבת', data.shabbat_saturday && 'צהריים'].filter(Boolean).join(' + ') || '—'} />
              <Row label="כשרות"       value={data.shabbat_kashrut} />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 text-right">
                {error}
              </p>
            )}

            <NavButtons
              onBack={() => setStep(6)}
              nextLabel="אישור ושליחה ✓"
              onNext={submitBeneficiary}
              pending={pending}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            FORMULAIRE מבשלת / מחלקת — step 10
        ══════════════════════════════════════════════════════════════════════ */}

        {role !== 'beneficiary' && step === 10 && (
          <form onSubmit={submitVolunteer} noValidate className="space-y-5">
            <input type="hidden" name="role" value={role ?? ''} />

            <h2 className="text-xl font-bold text-right" style={{ color: '#811453' }}>
              פרטים אישיים — {role === 'cook' ? 'מבשלת' : 'מחלקת'}
            </h2>

            <Field label="שם מלא *">
              <input name="name" required value={cvName}
                onChange={(e) => setCvName(e.target.value)}
                onBlur={() => touch('cvName')}
                placeholder="שם פרטי ושם משפחה"
                className={inputCls(!!(touched.cvName && cvName.trim().length < 2))} />
              <Err msg={touched.cvName && cvName.trim().length < 2 ? 'שם חייב להכיל לפחות 2 תווים' : null} />
            </Field>

            <Field label="מספר טלפון *">
              <input name="phone" type="tel" dir="ltr" required value={cvPhone}
                onChange={(e) => setCvPhone(e.target.value)}
                onBlur={() => touch('cvPhone')}
                placeholder="050-1234567"
                className={inputCls(!!cvPhoneErr())} />
              {cvPhoneErr()
                ? <Err msg={cvPhoneErr()} />
                : touched.cvPhone && validatePhone(cvPhone)
                  ? <p className="mt-1 text-xs font-medium text-green-600">✓ מספר תקין</p>
                  : null}
            </Field>

            <Field label="אימייל (אופציונלי)">
              <input name="email" type="email" dir="ltr"
                placeholder="example@gmail.com" className={inputCls(false)} />
              <p className="mt-1 text-xs text-zinc-400 text-right">לא חובה — לקבלת עדכונים במייל</p>
            </Field>

            <Field label="שכונה">
              <input name="neighborhood" value={cvNeigh}
                onChange={(e) => setCvNeigh(e.target.value)}
                placeholder="שכונה / אזור" className={inputCls(false)} />
            </Field>

            <Field label="כתובת">
              <input name="address" value={cvAddr}
                onChange={(e) => setCvAddr(e.target.value)}
                placeholder="כתובת מגורים" className={inputCls(false)} />
            </Field>

            {role === 'driver' && (
              <div className="flex flex-col items-end gap-2 text-right">
                <label className="text-sm font-medium text-zinc-800">האם יש לך רכב?</label>
                <div className="flex gap-3">
                  {[{ value: 'true', label: 'כן, יש לי רכב' }, { value: 'false', label: 'לא' }].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 text-sm text-zinc-800">
                      <input type="radio" name="has_car" value={opt.value}
                        checked={cvHasCar === opt.value}
                        onChange={() => setCvHasCar(opt.value)}
                        className="accent-[#811453]" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 text-right">
                {error}
              </p>
            )}

            <NavButtons
              onBack={() => { setStep(1); setError(null); }}
              nextLabel="שליחת הבקשה"
              nextDisabled={cvName.trim().length < 2 || !validatePhone(cvPhone)}
              pending={pending}
            />
          </form>
        )}

      </main>
    </div>
  );
}

// ─── Row helper pour le récapitulatif ─────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between px-4 py-3 gap-3">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="font-medium text-zinc-900 text-right">{value}</span>
    </div>
  );
}
