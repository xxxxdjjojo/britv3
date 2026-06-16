"use client";

/**
 * CandidateReviewQueue — admin invoice-candidate review queue (Truedeed
 * Phase 2, design spec §5).
 *
 * One card per candidate carrying everything the decision needs on a single
 * screen: introduction facts (applicant, listing, occurred/notified dates,
 * events count), the reported outcome (completion date, agreed price), the
 * fee line, and a source badge. Approve works as-is; Reject requires a note.
 * Candidates on a branch-query hold cannot be approved until the hold expires.
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatGBP } from "@/lib/formatters";
import type { CandidateReviewItem } from "@/types/truedeed";

export type CandidateDecisionInput = {
  candidateId: string;
  decision: "approved" | "rejected";
  note: string;
};

/**
 * Widened view of the shared CandidateReviewItem: the queue only reads these
 * fields, and callers may carry source/status/outcome values beyond the
 * shared unions (e.g. legacy "audit_match" rows). CandidateReviewItem is
 * assignable to this shape.
 */
export type CandidateQueueItem = Omit<
  CandidateReviewItem,
  "source" | "status" | "outcome"
> & {
  source: string;
  status: string;
  outcome: {
    outcome: string;
    completionDate: string | null;
    agreedPricePence: number | null;
  } | null;
};

type Props = Readonly<{
  items: CandidateQueueItem[];
  onDecide: (input: CandidateDecisionInput) => void;
}>;

/** Pence → "£249.00" (always two decimal places, unlike formatGBP). */
function formatPenceExact(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function sourceBadge(source: string): string {
  return source === "agent_report" ? "Agent reported" : "PPD audit";
}

export function CandidateReviewQueue({ items, onDecide }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No candidates awaiting review. Approved and rejected candidates leave
        this queue automatically.
      </div>
    );
  }

  function handleDecide(
    candidateId: string,
    decision: CandidateDecisionInput["decision"],
  ) {
    const note = notes[candidateId] ?? "";
    if (decision === "rejected" && note.trim().length === 0) {
      setErrors((prev) => ({
        ...prev,
        [candidateId]: "A note is required to reject a candidate.",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [candidateId]: null }));
    onDecide({ candidateId, decision, note });
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const noteId = `candidate-note-${item.candidateId}`;
        const error = errors[item.candidateId];
        const isOnHold = item.status === "on_hold_branch_query";
        const holdActive =
          isOnHold &&
          item.holdExpiresAt !== null &&
          new Date(item.holdExpiresAt).getTime() > new Date().getTime();

        return (
          <li
            key={item.candidateId}
            className="space-y-4 rounded-xl border bg-background p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.introduction.applicantName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.introduction.listingAddress}
                </p>
              </div>
              <Badge
                className={
                  item.source === "agent_report"
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-brand-secondary-light text-brand-secondary"
                }
              >
                {sourceBadge(item.source)}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Introduction</dt>
                <dd className="font-medium">
                  {formatDate(item.introduction.occurredAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Agent notified</dt>
                <dd className="font-medium">
                  {item.introduction.notifiedAt
                    ? formatDate(item.introduction.notifiedAt)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Event trail</dt>
                <dd className="font-medium">
                  {item.introduction.eventsCount} events
                </dd>
              </div>
              {item.outcome?.completionDate && (
                <div>
                  <dt className="text-muted-foreground">Completion</dt>
                  <dd className="font-medium">
                    {formatDate(item.outcome.completionDate)}
                  </dd>
                </div>
              )}
              {item.outcome?.agreedPricePence !== null &&
                item.outcome?.agreedPricePence !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">Agreed price</dt>
                    <dd className="font-medium">
                      {formatGBP(item.outcome.agreedPricePence)}
                    </dd>
                  </div>
                )}
              <div>
                <dt className="text-muted-foreground">Fee</dt>
                <dd className="font-medium">
                  {item.amountPence !== null && item.vatPence !== null
                    ? `${formatPenceExact(item.amountPence)} + ${formatPenceExact(item.vatPence)} VAT`
                    : "—"}
                </dd>
              </div>
            </dl>

            {isOnHold && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Awaiting branch reply
                {item.holdExpiresAt &&
                  ` — hold expires ${formatDate(item.holdExpiresAt)}`}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor={noteId}>Note</Label>
              <Textarea
                id={noteId}
                value={notes[item.candidateId] ?? ""}
                placeholder="Required when rejecting — why is this candidate not invoiceable?"
                onChange={(event) =>
                  setNotes((prev) => ({
                    ...prev,
                    [item.candidateId]: event.target.value,
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
                onClick={() => handleDecide(item.candidateId, "rejected")}
              >
                Reject
              </Button>
              <Button
                type="button"
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={holdActive}
                onClick={() => handleDecide(item.candidateId, "approved")}
              >
                Approve
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
