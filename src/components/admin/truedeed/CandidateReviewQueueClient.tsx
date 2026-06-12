"use client";

/**
 * Client wrapper for the admin invoice-candidate queue: posts decisions to
 * POST /api/admin/truedeed/invoice-candidates and refreshes the page data.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CandidateReviewQueue,
  type CandidateDecisionInput,
} from "./CandidateReviewQueue";
import type { CandidateReviewItem } from "@/types/truedeed";

type Props = Readonly<{
  items: CandidateReviewItem[];
}>;

export function CandidateReviewQueueClient({ items }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDecide(input: CandidateDecisionInput) {
    setError(null);
    try {
      const res = await fetch("/api/admin/truedeed/invoice-candidates", {
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
      <CandidateReviewQueue items={items} onDecide={handleDecide} />
    </div>
  );
}
