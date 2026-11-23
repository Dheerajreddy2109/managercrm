import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton stand-in for a page header (title + description + actions). */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

/** Grid of stat cards (dashboard). */
export function StatCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-14" />
          <Skeleton className="mt-1.5 h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Rows inside a card / table body. */
export function RowsSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 flex-1" style={{ maxWidth: `${45 + ((i * 13) % 40)}%` }} />
          <Skeleton className="ml-auto h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Generic content card with a heading bar and body lines. */
export function CardSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-lg border bg-card p-3 ${className ?? ""}`}>
      <Skeleton className="h-4 w-32" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${95 - ((i * 17) % 35)}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Table skeleton: header bar + rows of cells. */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex gap-4 border-b px-3 py-2.5">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: i === 0 ? "22%" : `${100 / cols}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b px-3 py-3 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5" style={{ width: c === 0 ? "24%" : `${100 / cols}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Kanban board skeleton (project detail). */
export function BoardSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="w-64 shrink-0 rounded-lg border bg-muted/30 p-2">
          <Skeleton className="mb-2 h-3.5 w-24" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="mb-2 rounded-md border bg-card p-2.5">
              <Skeleton className="h-3.5 w-full" />
              <div className="mt-2 flex gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="ml-auto size-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
