"use client";

/**
 * RebuttalQueue — admin pending-rebuttal moderation queue (Truedeed Phase 1, §6).
 *
 * Shows each pending rebuttal's introduction facts with the claimed evidence
 * date side-by-side against our recorded occurred-at date, links to the
 * (signed) evidence files, and takes an uphold/reject decision with a
 * mandatory reason.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatters";
import type { PendingRebuttal, RebuttalDecision } from "@/types/truedeed";

export type RebuttalDecisionInput = {
  rebuttalId: string;
  decision: RebuttalDecision;
  reason: string;
};

type Props = Readonly<{
  items: PendingRebuttal[];
  onDecide: (input: RebuttalDecisionInput) => void;
}>;

export function RebuttalQueue({ items, onDecide }: Props) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No pending rebuttals. Decided disputes leave this queue automatically.
      </div>
    );
  }

  function handleDecide(rebuttalId: string, decision: RebuttalDecision) {
    const reason = reasons[rebuttalId] ?? "";
    if (reason.trim().length === 0) {
      setErrors((prev) => ({
        ...prev,
        [rebuttalId]: "A reason is required for every decision.",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [rebuttalId]: null }));
    onDecide({ rebuttalId, decision, reason });
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const reasonId = `rebuttal-reason-${item.rebuttalId}`;
        const error = errors[item.rebuttalId];
        return (
          <li
            key={item.rebuttalId}
            className="space-y-4 rounded-xl border bg-background p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.introduction.applicantName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.introduction.listingAddress}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{item.branchName}</p>
                <p className="text-muted-foreground">
                  Submitted {formatDate(item.submittedAt)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Claimed prior contact</dt>
                <dd className="font-medium">{formatDate(item.evidenceDatedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Our recorded introduction</dt>
                <dd className="font-medium">
                  {formatDate(item.introduction.occurredAt)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              {item.evidenceUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Evidence file {index + 1}
                </a>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor={reasonId}>Reason</Label>
              <Textarea
                id={reasonId}
                value={reasons[item.rebuttalId] ?? ""}
                placeholder="Why are you upholding or rejecting this dispute?"
                onChange={(event) =>
                  setReasons((prev) => ({
                    ...prev,
                    [item.rebuttalId]: event.target.value,
                  }))
                }
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => handleDecide(item.rebuttalId, "rejected")}
              >
                Reject
              </Button>
              <Button
                type="button"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => handleDecide(item.rebuttalId, "upheld")}
              >
                Uphold
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
