"use client";

import { useRouter } from "next/navigation";
import type { VerificationQueueItem } from "@/services/admin/verification-service";
import { VerificationQueue } from "@/components/admin/VerificationQueue";

type Props = Readonly<{
  verifications: VerificationQueueItem[];
}>;

export function VerificationQueueClient({ verifications }: Props) {
  const router = useRouter();

  async function handleApprove(userId: string, notes?: string) {
    await fetch("/api/admin/verifications/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, decision: "approved", notes }),
    });
    router.refresh();
  }

  async function handleReject(userId: string, notes?: string) {
    await fetch("/api/admin/verifications/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, decision: "rejected", notes }),
    });
    router.refresh();
  }

  return (
    <VerificationQueue
      verifications={verifications}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
