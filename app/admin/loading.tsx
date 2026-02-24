import { SkeletonCard, SkeletonLine } from '@/app/components/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse" dir="rtl">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-32" />
        <SkeletonLine className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-[#F7D4E2] bg-white p-4 space-y-2">
            <SkeletonLine className="h-8 w-12" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        ))}
      </div>
      {[1, 2].map((i) => <SkeletonCard key={i} lines={3} />)}
    </div>
  );
}
