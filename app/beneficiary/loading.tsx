import { DashboardSkeleton } from '@/app/components/Skeleton';

export default function Loading() {
  return (
    <div style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)', minHeight: '100vh' }} dir="rtl">
      <header className="w-full px-4 py-3 shadow-md" style={{ backgroundColor: 'var(--brand)' }}>
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="h-8 w-20 rounded-full bg-white/30 animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-white/30 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-white/30 animate-pulse" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-md px-4 py-5">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
