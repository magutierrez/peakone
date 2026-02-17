'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisSkeleton() {
  return (
    <div className="flex w-full flex-col gap-10">
      {/* Terrain Section Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>

      {/* Altitude Section Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
