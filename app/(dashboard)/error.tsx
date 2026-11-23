"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { TriangleAlert } from "lucide-react";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="py-10">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={error.message || "An unexpected error occurred while loading this page."}
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={retry}>
              Try again
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/")}>
              Back to dashboard
            </Button>
          </div>
        }
      />
    </div>
  );
}
