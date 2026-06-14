"use client";

/**
 * Client wrapper for the admin rebuttal queue: posts decisions to
 * POST /api/admin/truedeed/rebuttals and refreshes the page data.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RebuttalQueue,
  type RebuttalDecisionInput,
} from "./RebuttalQueue";
import type { PendingRebuttal } from "@/types/truedeed";

type Props = Readonly<{
  items: PendingRebuttal[];
}>;

export function RebuttalQueueClient({ items }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDecide(input: RebuttalDecisionInput) {
    setError(null);
    try {
      const res = await fetch("/api/admin/truedeed/rebuttals", {
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
      <RebuttalQueue items={items} onDecide={handleDecide} />
    </div>
  );
}
