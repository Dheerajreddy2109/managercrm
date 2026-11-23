import { CardSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/shared/Loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <CardSkeleton lines={7} />
        <CardSkeleton lines={7} />
      </div>
      <div className="mt-3">
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}
