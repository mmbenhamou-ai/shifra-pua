import { SkeletonCard, SkeletonLine } from '@/app/components/Skeleton';

export default function AdminUsersLoading() {
  return (
    <div className="space-y-5 pb-4 animate-pulse" dir="rtl">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-32" />
        <SkeletonLine className="h-4 w-40" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} className="h-8 w-16" />
        ))}
      </div>

      <SkeletonCard lines={5} />
    </div>
  );
}

