export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[#F7D4E2] ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F7D4E2] bg-white p-4 shadow-sm space-y-3">
      <SkeletonLine className="h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-8 animate-pulse" dir="rtl">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-full bg-[#F7D4E2]" />
        <div className="h-4 w-24 rounded-full bg-[#FBE4F0]" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-[#F7D4E2] bg-white p-3 space-y-2">
            <div className="h-3 w-10 rounded-full bg-[#FBE4F0]" />
            <div className="h-7 w-8 rounded-full bg-[#F7D4E2]" />
          </div>
        ))}
      </div>
      {/* Cards */}
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} lines={4} />
      ))}
    </div>
  );
}
