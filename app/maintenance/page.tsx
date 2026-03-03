export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
         dir="rtl"
         style={{ background: 'linear-gradient(135deg, #FFF7FB, #FBE4F0)' }}>
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
           style={{ backgroundColor: '#FBE4F0' }}>🔧</div>
      <h1 className="text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>בתחזוקה</h1>
      <p className="mt-3 text-base text-zinc-600 leading-relaxed max-w-xs">
        האפליקציה בתחזוקה זמנית.<br />
        נחזור בקרוב! 💛
      </p>
      <p className="mt-6 text-xs text-zinc-400">שפרה ופועה — ביחד אנחנו חזקות</p>
    </div>
  );
}
