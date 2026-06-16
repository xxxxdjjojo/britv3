"use client";

/**
 * Client wrapper for the admin dispute workbench: posts decisions to
 * POST /api/admin/truedeed/disputes and refreshes the page data on success.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DisputeQueue,
  type DisputeDecisionInput,
} from "./DisputeQueue";
import type { OpenInvoiceDispute } from "@/lib/truedeed/queries";

type Props = Readonly<{
  items: OpenInvoiceDispute[];
}>;

export function DisputeQueueClient({ items }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDecide(input: DisputeDecisionInput) {
    setError(null);
    try {
      const res = await fetch("/api/admin/truedeed/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Failed to record the decision.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to record the decision. Please try again.");
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <DisputeQueue items={items} onDecide={handleDecide} />
    </div>
  );
}
