import { CardSkeleton, PageHeaderSkeleton } from "@/components/shared/Loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyUpdatesLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="ml-auto h-8 w-48" />
      </div>
      <div className="mb-3 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-20 shrink-0 rounded-md" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="ml-auto size-4 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
        <CardSkeleton lines={6} />
      </div>
    </div>
  );
}
