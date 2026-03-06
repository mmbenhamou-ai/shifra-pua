'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from './actions';
import GoogleMapsScript from '@/app/components/GoogleMapsScript';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'beneficiary' | 'cook' | 'driver';
type MainCategory = 'beneficiary' | 'volunteer' | null;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

interface BeneficiaryData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  num_adults: string;
  num_children: string;
  is_vegetarian: boolean;
  spicy_level: string;
  cooking_notes: string;
  birth_date: string;
  start_date: string;
  shabbat_friday: boolean;
  shabbat_saturday: boolean;
  shabbat_kashrut: string;
}

const EMPTY: BeneficiaryData = {
  first_name: '', last_name: '', phone: '', email: '', address: '', neighborhood: '',
  num_adults: '2', num_children: '0',
  is_vegetarian: false, spicy_level: '0', cooking_notes: '',
  birth_date: '', start_date: '',
  shabbat_friday: false, shabbat_saturday: false, shabbat_kashrut: 'רגיל',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KASHRUT_OPTIONS = ['רגיל', 'חלק', 'מהדרין', 'בד"ץ'];
const TOTAL_BENEFICIARY_STEPS = 7;

function validatePhone(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  return /^05\d{8}$/.test(d) || /^9725\d{8}$/.test(d);
}

function inputCls(err: boolean) {
  return [
    'form-input block w-full border bg-slate-50 h-14 px-4 transition-all text-right placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-[#91006A] focus:outline-none',
    err ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-[#91006A]'
  ].join(' ');
}



function Field({ label, children, optional = false }: { label: string; children: React.ReactNode, optional?: boolean }) {
  return (
    <div className="flex flex-col items-end gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-700">
        {label} {optional && <span className="text-slate-400 font-normal">(אופציונלי)</span>}
      </label>
      {children}
    </div>
  );
}

function Err({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600 w-full text-right">{msg}</p>;
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────

function NavButtons({
  onBack, onNext, nextLabel = 'המשך', nextDisabled = false, pending = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex gap-4 pt-4 mt-2">
      {onBack && (
        <button type="button" onClick={onBack}
          className="flex-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold h-14 transition-all flex items-center justify-center gap-2 rounded-lg">
          ← חזרה
        </button>
      )}
      <button
        type={onNext ? 'button' : 'submit'}
        onClick={onNext}
        disabled={nextDisabled || pending}
        className="flex-[2] bg-[#91006A] hover:bg-[#91006A]/90 text-white font-bold h-14 shadow-lg shadow-[#91006A]/20 transition-all flex items-center justify-center gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
        {pending ? '...שולחת' : nextLabel}
      </button>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / (total - 1)) * 100);
  return (
    <div className="space-y-2 mb-2">
      <div className="flex justify-between text-xs text-slate-500 font-medium">
        <span>שלב {step} מתוך {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 bg-[#91006A]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 gap-3 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 shrink-0 text-sm">{label}</span>
      <span className="font-medium text-slate-900 text-right text-sm px-4">{value}</span>
    </div>
  );
}

// ─── Main Component Wizard ────────────────────────────────────────────────────

interface SignupWizardProps {
  /** type from URL (?type=volunteer|beneficiary), lu côté client pour éviter suspension useSearchParams */
  initialType?: string | null;
}

function SignupWizard({ initialType }: SignupWizardProps) {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [category, setCategory] = useState<MainCategory>(null);

  const [wantCook, setWantCook] = useState(false);
  const [wantDriver, setWantDriver] = useState(false);
  const notifCook = true;
  const notifDrv = true;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<BeneficiaryData>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cvFirstName, setCvFirstName] = useState('');
  const [cvLastName, setCvLastName] = useState('');
  const [cvPhone, setCvPhone] = useState('');
  const [cvNeigh, setCvNeigh] = useState('');
  const [cvHasCar, setCvHasCar] = useState('false');

  // Auto-select type from URL (initialType passé par le parent pour éviter useSearchParams qui suspend)
  useEffect(() => {
    const type = initialType ?? null;
    if (type === 'beneficiary' && step === 1 && category === null) {
      setCategory('beneficiary');
      setRole('beneficiary');
      setStep(2); // On saute l'étape 1
    } else if (type === 'volunteer' && step === 1 && category === null) {
      setCategory('volunteer');
      // On reste à l'étape 1 pour choisir le sous-type
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialType]);

  const effectiveRole: Role = wantCook ? 'cook' : 'driver';
  const alsoDriver = wantCook && wantDriver;

  const set = (k: keyof BeneficiaryData, v: string | boolean) => setData((p) => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

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

  function step2Valid() {
    return data.first_name.trim().length >= 2 && data.last_name.trim().length >= 2 && validatePhone(data.phone) && data.address.trim().length > 0;
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

  async function submitBeneficiary() {
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.append('role', 'beneficiary');
      fd.append('name', `${data.first_name.trim()} ${data.last_name.trim()}`);
      fd.append('phone', data.phone);
      fd.append('email', data.email);
      fd.append('address', data.address);
      fd.append('neighborhood', data.neighborhood);
      fd.append('birth_date', data.birth_date);
      fd.append('start_date', data.start_date);
      fd.append('num_adults', data.num_adults);
      fd.append('num_children', data.num_children);
      fd.append('is_vegetarian', data.is_vegetarian ? 'true' : 'false');
      fd.append('spicy_level', data.spicy_level);
      fd.append('cooking_notes', data.cooking_notes);
      fd.append('shabbat_friday', data.shabbat_friday ? 'true' : 'false');
      fd.append('shabbat_saturday', data.shabbat_saturday ? 'true' : 'false');
      fd.append('shabbat_kashrut', data.shabbat_kashrut);
      await registerUser(fd);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      setPending(false);
    }
  }

  async function submitVolunteer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ cvPhone: true, cvFirstName: true, cvLastName: true });
    if (!cvFirstName.trim() || !cvLastName.trim() || !validatePhone(cvPhone)) return;
    setError(null);
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      const roleToSend = alsoDriver ? 'both' : effectiveRole;
      fd.set('role', roleToSend);
      fd.set('name', `${cvFirstName.trim()} ${cvLastName.trim()}`);
      fd.append('also_driver', alsoDriver ? 'true' : 'false');
      fd.append('notif_cooking', notifCook ? 'true' : 'false');
      fd.append('notif_delivery', notifDrv ? 'true' : 'false');
      if (alsoDriver) fd.set('has_car', 'true');
      await registerUser(fd);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      setPending(false);
    }
  }

  function handleBackGlobal() {
    // Bouton retour global du header : revenir simplement à la page précédente.
    // Cela évite les cas où la logique de step/initialType ne couvre pas tous les scénarios.
    router.back();
  }

  return (
    <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col my-auto relative z-10 mx-auto">
      <div className="flex items-center p-4 justify-between border-b border-slate-100">
        <button
          type="button"
          className="text-[#91006A] p-2 hover:bg-[#91006A]/10 rounded-full transition-colors font-bold"
          onClick={handleBackGlobal}
        >
          ←
        </button>
        <h2 className="text-[#91006A] text-lg font-bold flex-1 text-center pr-8">
          הרשמה מהירה
        </h2>
      </div>

      <main className="px-6 py-6 pb-12 flex flex-col gap-6">

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-4">
              <div className="w-16 h-16 bg-[#91006A]/10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-3xl">
              </div>
              <h1 className="text-2xl font-bold text-slate-900">ברוכה הבאה!</h1>
              <p className="text-slate-500">בחרי את סוג ההרשמה שלך</p>
            </div>

            <div className="flex flex-col gap-4">
              <button type="button"
                onClick={() => { setCategory('beneficiary'); setRole('beneficiary'); setStep(2); }}
                className="flex items-center justify-between rounded-2xl border-2 p-4 text-right transition hover:border-[#91006A]/40"
                style={{
                  borderColor: category === 'beneficiary' ? 'var(--brand)' : '#F1F5F9',
                  backgroundColor: category === 'beneficiary' ? '#FFF7FB' : '#FFFFFF',
                }}>
                <span className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl pointer-events-none"></span>
                <div className="flex flex-col items-end gap-0.5 ml-4 flex-1">
                  <span className="text-lg font-bold text-slate-900">יולדת</span>
                  <span className="text-sm text-slate-500">אני זקוקה לארוחות לאחר הלידה</span>
                </div>
              </button>

              <button type="button"
                onClick={() => { setCategory('volunteer'); setRole(null); }}
                className="flex items-center justify-between rounded-2xl border-2 p-4 text-right transition hover:border-[#91006A]/40"
                style={{
                  borderColor: category === 'volunteer' ? 'var(--brand)' : '#F1F5F9',
                  backgroundColor: category === 'volunteer' ? '#FFF7FB' : '#FFFFFF',
                }}>
                <span className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl pointer-events-none"></span>
                <div className="flex flex-col items-end mr-4 flex-1">
                  <span className="text-lg font-bold text-slate-900">מתנדבת</span>
                  <span className="text-sm text-slate-500">אני רוצה לעזור למשפחות</span>
                </div>
              </button>
            </div>

            {category === 'volunteer' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-bold text-slate-800 text-right">
                  במה תרצי לעזור? (ניתן לבחור יותר מאחת)
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'cook', label: 'מבשלת', desc: 'לבשל ארוחות בבית', val: wantCook, set: setWantCook },
                    { id: 'driver', label: 'מחלקת', desc: 'לחלק ארוחות לבתים', val: wantDriver, set: setWantDriver },
                  ].map((opt) => (
                    <button key={opt.id} type="button"
                      onClick={() => opt.set(!opt.val)}
                      className="flex items-center justify-between rounded-xl border p-3 text-right bg-white transition shadow-sm hover:border-[#91006A]/30"
                      style={{
                        borderColor: opt.val ? 'var(--brand)' : '#E2E8F0',
                        boxShadow: opt.val ? '0 0 0 1px var(--brand)' : '',
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded border transition"
                          style={{ borderColor: opt.val ? 'var(--brand)' : '#CBD5E1', backgroundColor: opt.val ? 'var(--brand)' : '#fff' }}>
                          {opt.val && <span className="text-white text-xs font-bold line-height-none mt-0.5">✓</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right flex-1 justify-end">
                        <div>
                          <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <NavButtons
                  nextLabel="המשך להרשמה"
                  nextDisabled={!wantCook && !wantDriver}
                  onNext={() => setStep(10)}
                />
              </div>
            )}

          </div>
        )}

        {role === 'beneficiary' && step >= 2 && step <= 7 && (
          <ProgressBar step={step - 1} total={TOTAL_BENEFICIARY_STEPS - 1} />
        )}

        {/* STEP 2 */}
        {role === 'beneficiary' && step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-right text-[#91006A]">פרטים אישיים</h2>

            <div className="flex gap-3 w-full">
              <Field label="שם פרטי *">
                <input value={data.first_name} onChange={(e) => set('first_name', e.target.value)}
                  onBlur={() => touch('first_name')} placeholder="שם פרטי"
                  className={inputCls(!!(touched.first_name && data.first_name.trim().length < 2))} />
                <Err msg={touched.first_name && data.first_name.trim().length < 2 ? 'לפחות 2 תווים' : null} />
              </Field>

              <Field label="שם משפחה *">
                <input value={data.last_name} onChange={(e) => set('last_name', e.target.value)}
                  onBlur={() => touch('last_name')} placeholder="שם משפחה"
                  className={inputCls(!!(touched.last_name && data.last_name.trim().length < 2))} />
                <Err msg={touched.last_name && data.last_name.trim().length < 2 ? 'לפחות 2 תווים' : null} />
              </Field>
            </div>

            <Field label="מספר טלפון *">
              <input value={data.phone} onChange={(e) => set('phone', e.target.value)}
                onBlur={() => touch('phone')} placeholder="050-1234567"
                type="tel" dir="ltr" className={inputCls(!!phoneErr())} />
              {phoneErr()
                ? <Err msg={phoneErr()} />
                : touched.phone && validatePhone(data.phone)
                  ? <p className="mt-1 text-xs font-medium text-emerald-600 w-full text-right">✓ מספר תקין</p>
                  : null}
            </Field>

            <Field label="כתובת מגורים *">
              <AddressAutocomplete
                value={data.address}
                onChange={(addr) => set('address', addr)}
                onBlur={() => touch('address')}
                placeholder="רחוב, מספר, עיר"
                className={inputCls(!!(touched.address && !data.address.trim()))} />
              <Err msg={touched.address && !data.address.trim() ? 'כתובת היא שדה חובה' : null} />
            </Field>

            <Field label="שכונה" optional>
              <input value={data.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}
                placeholder="שכונה / אזור" className={inputCls(false)} />
            </Field>

            <Field label="אימייל" optional>
              <input type="email" dir="ltr" value={data.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="example@gmail.com" className={inputCls(false)} />
              <p className="mt-1 text-xs text-slate-400 text-right w-full">לקבלת עדכונים חשובים במייל</p>
            </Field>

            <Field label="תאריך לידת התינוק/ת" optional>
              <div className="relative w-full">
                <input type="date" dir="ltr" value={data.birth_date}
                  onChange={(e) => set('birth_date', e.target.value)} className={inputCls(false) + " text-right placeholder-transparent"} />
              </div>
            </Field>

            <NavButtons onBack={handleBackGlobal} onNext={() => { setTouched({ first_name: true, last_name: true, phone: true, address: true }); if (step2Valid()) setStep(3); }} nextDisabled={!step2Valid()} />
          </div>
        )}

        {role === 'beneficiary' && step === 3 && (
          <div className="space-y-6">
            <div className="text-right space-y-1">
              <h2 className="text-xl font-bold text-[#91006A]">הרכב המשפחה</h2>
              <p className="text-sm text-slate-500">כדי שנדע כמה מנות להכין</p>
            </div>

            <Field label="מספר מבוגרים *">
              <input type="text" inputMode="numeric" pattern="[0-9]*" min="1" max="10" dir="ltr"
                value={data.num_adults} onChange={(e) => set('num_adults', e.target.value)}
                className={inputCls(false) + " text-center"} />
            </Field>

            <Field label="מספר ילדים">
              <input type="text" inputMode="numeric" pattern="[0-9]*" min="0" max="15" dir="ltr"
                value={data.num_children} onChange={(e) => set('num_children', e.target.value)}
                className={inputCls(false) + " text-center"} />
            </Field>

            <NavButtons onBack={() => setStep(2)} onNext={() => { if (step3Valid()) setStep(4); }} nextDisabled={!step3Valid()} />
          </div>
        )}

        {role === 'beneficiary' && step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-right text-[#91006A]">העדפות אכילה</h2>

            <button type="button"
              onClick={() => set('is_vegetarian', !data.is_vegetarian)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition shadow-sm hover:border-[#91006A]/30"
              style={{
                borderColor: data.is_vegetarian ? 'var(--brand)' : '',
                boxShadow: data.is_vegetarian ? '0 0 0 1px var(--brand)' : '',
              }}>
              <span className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl pointer-events-none"></span>
              <div className="text-right flex-1 mr-4">
                <p className="font-bold text-slate-900">צמחוני</p>
                <p className="text-sm text-slate-500">ללא בשר ועוף</p>
              </div>
            </button>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-slate-700 text-right w-full">רמת חריפות</p>
              <div className="flex gap-2">
                {[
                  { val: '0', label: 'לא חריף' },
                  { val: '1', label: 'קצת חריף' },
                  { val: '2', label: 'ממש חריף' },
                ].map((opt) => (
                  <button key={opt.val} type="button"
                    onClick={() => set('spicy_level', opt.val)}
                    className="flex-1 rounded-lg py-3 text-sm font-bold transition border my-auto block border-slate-200"
                    style={{
                      backgroundColor: data.spicy_level === opt.val ? 'var(--brand)' : '#fff',
                      borderColor: data.spicy_level === opt.val ? 'var(--brand)' : '#E2E8F0',
                      color: data.spicy_level === opt.val ? '#fff' : '#475569',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="הערות למטבח (אלרגיות, הגבלות...)" optional>
              <textarea value={data.cooking_notes}
                onChange={(e) => set('cooking_notes', e.target.value)}
                placeholder="לדוגמה: ללא כמון, ללא פלפל, אלרגיה לאגוזים"
                rows={3}
                className={inputCls(false) + ' resize-none pt-4 h-auto pb-4 appearance-none rounded-2xl'} />
            </Field>

            <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} />
          </div>
        )}

        {role === 'beneficiary' && step === 5 && (
          <div className="space-y-6">
            <div className="text-right space-y-1 block w-full">
              <h2 className="text-xl font-bold text-[#91006A]">ארוחות בוקר עשירות</h2>
              <p className="text-sm text-slate-500 max-w-[280px] ml-auto">
                תקבלי ארוחת בוקר כל יום במשך השבועיים שלאחר הלידה. בחרי מאיזה תאריך להתחיל.
              </p>
            </div>

            <Field label="תאריך התחלה *">
              <div className="relative w-full">
                <input type="date" dir="ltr" min={today}
                  value={data.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                  onBlur={() => touch('start_date')}
                  className={inputCls(!!(touched.start_date && !step5Valid())) + " text-right font-medium text-slate-800 placeholder-transparent"} />
              </div>
              <Err msg={touched.start_date && !data.start_date ? 'נא לבחור תאריך התחלה' : null} />

              {data.start_date && (
                <div className="w-full mt-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-right">
                  <p className="text-sm text-indigo-800 font-medium">סך הכל 14 ימים של פינוק!</p>
                  <p className="text-xs text-indigo-600 mt-1">עד {new Date(new Date(data.start_date).getTime() + 14 * 86400000).toLocaleDateString('he-IL')}</p>
                </div>
              )}
            </Field>

            <NavButtons onBack={() => setStep(4)} onNext={() => { touch('start_date'); if (step5Valid()) setStep(6); }} nextDisabled={!step5Valid()} />
          </div>
        )}

        {role === 'beneficiary' && step === 6 && (
          <div className="space-y-6">
            <div className="text-right space-y-1 block w-full">
              <h2 className="text-xl font-bold text-[#91006A]">ארוחות שבת</h2>
              <p className="text-sm text-slate-500">בחרי אילו ארוחות שבת תרצי לקבל במשך התקופה</p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { key: 'shabbat_friday' as const, label: 'ליל שבת (ערב)' },
                { key: 'shabbat_saturday' as const, label: 'שבת בבוקר/צהריים' },
              ].map((opt) => (
                <button key={opt.key} type="button"
                  onClick={() => set(opt.key, !data[opt.key])}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition shadow-sm hover:border-[#91006A]/30"
                  style={{
                    borderColor: data[opt.key] ? 'var(--brand)' : '',
                    boxShadow: data[opt.key] ? '0 0 0 1px var(--brand)' : '',
                  }}>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-[15px]">{opt.label}</p>
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors ml-2"
                      style={{
                        borderColor: data[opt.key] ? 'var(--brand)' : '#CBD5E1',
                        backgroundColor: data[opt.key] ? 'var(--brand)' : 'transparent'
                      }}>
                      {data[opt.key] && <span className="text-white text-xs font-bold leading-none">✓</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 text-right">
              <p className="text-sm font-medium text-slate-800">כשרות מינימלית נדרשת</p>
              <div className="grid grid-cols-2 gap-3">
                {KASHRUT_OPTIONS.map((k) => (
                  <button key={k} type="button"
                    onClick={() => set('shabbat_kashrut', k)}
                    className="rounded-lg py-2.5 text-sm font-bold transition border"
                    style={{
                      backgroundColor: data.shabbat_kashrut === k ? 'var(--brand)' : '#fff',
                      borderColor: data.shabbat_kashrut === k ? 'var(--brand)' : '#E2E8F0',
                      color: data.shabbat_kashrut === k ? '#fff' : '#475569',
                    }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <NavButtons onBack={() => setStep(5)} onNext={() => { if (step6Valid()) setStep(7); }} nextDisabled={!step6Valid()} />
          </div>
        )}

        {role === 'beneficiary' && step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-right text-[#91006A]">סיכום הבקשה לחבילת לידה</h2>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden divide-y divide-slate-100 flex flex-col items-stretch">
              <Row label="שם" value={`${data.first_name} ${data.last_name}`} />
              <Row label="טלפון" value={data.phone} />
              <Row label="הרכב" value={`${data.num_adults} מבוגרים, ${data.num_children} ילדים`} />
              <Row label="תזונה" value={data.is_vegetarian ? 'צמחוני' : 'רגיל'} />
              <Row label="התחלה" value={data.start_date ? new Date(data.start_date).toLocaleDateString('he-IL') : '—'} />
              {(data.shabbat_friday || data.shabbat_saturday) && (
                <Row label="שבתות" value={`${data.shabbat_friday ? 'ליל שבת' : ''} ${data.shabbat_friday && data.shabbat_saturday ? '+' : ''} ${data.shabbat_saturday ? 'בוקר' : ''}`} />
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 text-right">
                {error}
              </p>
            )}

            <NavButtons
              onBack={() => setStep(6)}
              nextLabel="אישור ושליחה מלאה ✓"
              onNext={submitBeneficiary}
              pending={pending}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            FORMULAIRE מבשלת / מחלקת — step 10
        ══════════════════════════════════════════════════════════════════════ */}

        {category === 'volunteer' && step === 10 && (
          <form onSubmit={submitVolunteer} noValidate className="space-y-5">
            <input type="hidden" name="role" value={effectiveRole} />

            <h2 className="text-xl font-bold text-right text-[#91006A]">
              פרטי התנדבות —{' '}
              {alsoDriver ? 'מבשלת ומחלקת' : wantCook ? 'מבשלת' : 'מחלקת'}
            </h2>

            <div className="flex gap-3 w-full">
              <Field label="שם פרטי *">
                <input name="first_name" required value={cvFirstName}
                  onChange={(e) => setCvFirstName(e.target.value)}
                  onBlur={() => touch('cvFirstName')}
                  placeholder="שם פרטי"
                  className={inputCls(!!(touched.cvFirstName && cvFirstName.trim().length < 2))} />
                <Err msg={touched.cvFirstName && cvFirstName.trim().length < 2 ? 'לפחות 2 תווים' : null} />
              </Field>

              <Field label="שם משפחה *">
                <input name="last_name" required value={cvLastName}
                  onChange={(e) => setCvLastName(e.target.value)}
                  onBlur={() => touch('cvLastName')}
                  placeholder="שם משפחה"
                  className={inputCls(!!(touched.cvLastName && cvLastName.trim().length < 2))} />
                <Err msg={touched.cvLastName && cvLastName.trim().length < 2 ? 'לפחות 2 תווים' : null} />
              </Field>
            </div>

            <Field label="מספר טלפון *">
              <input name="phone" type="tel" dir="ltr" required value={cvPhone}
                onChange={(e) => setCvPhone(e.target.value)}
                onBlur={() => touch('cvPhone')}
                placeholder="050-1234567"
                className={inputCls(!!cvPhoneErr())} />
              {cvPhoneErr()
                ? <Err msg={cvPhoneErr()} />
                : touched.cvPhone && validatePhone(cvPhone)
                  ? <p className="mt-1 text-xs font-medium text-emerald-600 w-full text-right">✓ מספר תקין</p>
                  : null}
            </Field>

            <Field label="אימייל" optional>
              <input name="email" type="email" dir="ltr"
                placeholder="example@gmail.com" className={inputCls(false)} />
            </Field>

            <Field label="עיר / אזור" optional>
              <input name="neighborhood" value={cvNeigh}
                onChange={(e) => setCvNeigh(e.target.value)}
                placeholder="שכונה מרכזית לפעילות" className={inputCls(false)} />
            </Field>

            {wantDriver && !wantCook && (
              <div className="flex flex-col items-end gap-3 text-right pt-2 border-t border-slate-100">
                <label className="text-sm font-medium text-slate-800">האם יש לך רכב פנוי?</label>
                <div className="flex gap-4">
                  {[{ value: 'true', label: 'כן, יש לי רכב' }, { value: 'false', label: 'לא, אין לי' }].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-2 px-4 rounded-xl">
                      <input type="radio" name="has_car" value={opt.value}
                        checked={cvHasCar === opt.value}
                        onChange={() => setCvHasCar(opt.value)}
                        className="w-4 h-4 accent-[#91006A]" />
                      <span className="text-sm font-medium text-slate-700">{opt.label}</span>
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

            <div className="pt-2">
              <NavButtons
                onBack={handleBackGlobal}
                nextLabel="סיום הרשמה והצטרפות"
                nextDisabled={cvFirstName.trim().length < 2 || cvLastName.trim().length < 2 || !validatePhone(cvPhone)}
                pending={pending}
              />
            </div>
          </form>
        )}

      </main>
    </div>
  );
}

// ─── Client wrapper: formulaire affiché tout de suite, type lu depuis l'URL en useEffect (évite blocage) ───

function SignupPageClient() {
  const [initialType, setInitialType] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInitialType(new URLSearchParams(window.location.search).get('type'));
    }
  }, []);
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5f8] relative z-0"
      dir="rtl"
    >
      <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#91006A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#91006A]/5 rounded-full blur-3xl" />
      </div>

      <GoogleMapsScript />
      <SignupWizard initialType={initialType} />
    </div>
  );
}

// ─── Entry Point ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  return <SignupPageClient />;
}
