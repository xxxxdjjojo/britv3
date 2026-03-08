"use client";

import { useRouter } from "next/navigation";
import type { FlaggedListing } from "@/components/admin/ModerationQueue";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

type Props = Readonly<{
  listings: FlaggedListing[];
}>;

export function ModerationQueueClient({ listings }: Props) {
  const router = useRouter();

  async function handleApprove(listingId: string) {
    await fetch(`/api/admin/listings/${listingId}/approve`, { method: "POST" });
    router.refresh();
  }

  async function handleReject(listingId: string) {
    await fetch(`/api/admin/listings/${listingId}/reject`, { method: "POST" });
    router.refresh();
  }

  return (
    <ModerationQueue
      listings={listings}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
