import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NotFound() {
  return <EmptyState title="Not found" description="This item doesn't exist or was deleted." action={<Button size="sm" render={<Link href="/" />}>Back to dashboard</Button>} />;
}
