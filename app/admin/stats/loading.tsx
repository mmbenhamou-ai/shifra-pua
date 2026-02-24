import { SkeletonLine } from '@/app/components/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse" dir="rtl">
      <SkeletonLine className="h-7 w-28" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map((i) => (
          <div key={i} className="rounded-2xl border border-[#F7D4E2] bg-white p-4 space-y-2">
            <SkeletonLine className="h-8 w-12" />
            <SkeletonLine className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#F7D4E2] bg-white p-4 space-y-3">
        <SkeletonLine className="h-4 w-40" />
        <div className="flex items-end gap-2 h-24">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="flex-1 rounded-t bg-[#F7D4E2]" style={{ height: `${30 + i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
