import { CardSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/shared/Loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberDetailLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-16" />
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>
      <div className="mb-3 flex gap-4 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-20" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <CardSkeleton lines={5} />
        <CardSkeleton className="lg:col-span-2" lines={6} />
      </div>
      <div className="mt-3">
        <PageHeaderSkeleton />
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  );
}
