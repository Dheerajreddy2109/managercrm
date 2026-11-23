import { BoardSkeleton } from "@/components/shared/Loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-20" />
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-72" />
        <Skeleton className="h-2 w-full max-w-xl" />
      </div>
      <div className="mb-3 flex gap-4 border-b pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-16" />
        ))}
      </div>
      <BoardSkeleton />
    </div>
  );
}
