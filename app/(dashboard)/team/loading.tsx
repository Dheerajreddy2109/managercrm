import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/Loading";

export default function TeamLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
