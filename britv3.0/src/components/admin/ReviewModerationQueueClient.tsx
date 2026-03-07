"use client";

import { useRouter } from "next/navigation";
import type { ReportedReview } from "@/services/admin-service";
import { ReviewModerationQueue } from "@/components/admin/ReviewModerationQueue";

type Props = Readonly<{
  reports: ReportedReview[];
  adminId: string;
}>;

export function ReviewModerationQueueClient({ reports, adminId }: Props) {
  const router = useRouter();

  async function handleResolve(reportId: string, note?: string) {
    await fetch("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, resolution: "resolved", note, adminId }),
    });
    router.refresh();
  }

  async function handleDismiss(reportId: string, note?: string) {
    await fetch("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, resolution: "dismissed", note, adminId }),
    });
    router.refresh();
  }

  return (
    <ReviewModerationQueue
      reports={reports}
      onResolve={handleResolve}
      onDismiss={handleDismiss}
    />
  );
}
