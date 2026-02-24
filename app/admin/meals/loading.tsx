import { SkeletonCard, SkeletonLine } from '@/app/components/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse" dir="rtl">
      <SkeletonLine className="h-7 w-32" />
      <div className="flex gap-2">
        {[1,2,3,4].map((i) => <div key={i} className="h-8 w-16 rounded-full bg-[#F7D4E2]" />)}
      </div>
      {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} lines={4} />)}
    </div>
  );
}
