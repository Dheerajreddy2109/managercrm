import { CardSkeleton, PageHeaderSkeleton } from "@/components/shared/Loading";

export default function DashboardLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="space-y-4">
        <CardSkeleton lines={6} />
        <CardSkeleton lines={6} />
      </div>
    </div>
  );
}
