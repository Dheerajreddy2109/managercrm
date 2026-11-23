import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/Loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-3 flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
