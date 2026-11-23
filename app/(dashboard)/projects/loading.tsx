import { PageHeaderSkeleton } from "@/components/shared/Loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="mt-1.5 h-3 w-24" />
            <Skeleton className="mt-3 h-1.5 w-full" />
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="ml-auto h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
