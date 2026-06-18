"use client";

/**
 * DisputeQueue — admin workbench for open invoice_disputes (Phase 5).
 *
 * Each card shows the invoice facts (invoice number, state, address,
 * applicant, branch, ledger introduction date), the agent's grounds,
 * the signed evidence URLs, and the clause-9.5 properly_raised flag.
 * The decision form requires a D1–D5 category and a reason; "Concede"
 * cancels the invoice via decide_invoice_dispute, "Reject" resumes the
 * dunning clock where it stopped (Phase 4 state_before_dispute).
 *
 * Per-card playbook guidance for the selected category is rendered as a
 * subdued helper line — the playbook says "say it openly" so we surface
 * the right words at the right moment.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { OpenInvoiceDispute } from "@/lib/truedeed/queries";

export type DisputeCategory =
  | "D1_source"
  | "D2_fell_through"
  | "D3_different_applicant"
  | "D4_no_tail_agreement"
  | "D5_fee_level";

export type DisputeDecisionInput = {
  disputeId: string;
  decision: "conceded" | "rejected";
  category: DisputeCategory;
  reason: string;
};

type Props = Readonly<{
  items: OpenInvoiceDispute[];
  onDecide: (input: DisputeDecisionInput) => void;
}>;

const CATEGORY_OPTIONS: Array<{ value: DisputeCategory; label: string }> = [
  { value: "D1_source", label: "D1 — Source ('came from a portal, not you')" },
  { value: "D2_fell_through", label: "D2 — Fall-through" },
  { value: "D3_different_applicant", label: "D3 — Different applicant" },
  { value: "D4_no_tail_agreement", label: "D4 — Tail agreement" },
  { value: "D5_fee_level", label: "D5 — Fee level" },
];

const CATEGORY_GUIDANCE: Record<DisputeCategory, string> = {
  D1_source:
    "Default: window expired without rebuttal → fee stands (clause 3.4 replaces effective cause). Concede only on pre-dated same-property evidence, once per branch per 12 months.",
  D2_fell_through:
    "If genuine: invoice should not exist pre-completion (clause 7.1) — cancel within 5 business days, apologise, keep the tail alive. Diarise PPD watch on the address.",
  D3_different_applicant:
    "Run the clause-10.2 question first. Connected Person (spouse, household, SPV, etc.) → fee stands. Demonstrably unrelated buyer → concede with thanks and log as matcher false positive.",
  D4_no_tail_agreement:
    "Director signature → fee stands; attach the executed copy. Defective execution → SOLICITOR before asserting; pragmatic write-off + fresh signature beats litigating ostensible authority.",
  D5_fee_level:
    "Default: flat fee by design, doesn't scale up either. No ad-hoc discounts. Structural fix via clause 4.7 / 13.3 variation if data shows a real low-value segment problem.",
};

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Europe/London",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return EN_GB_DATE.format(new Date(iso));
}

function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function DisputeQueue({ items, onDecide }: Props) {
  const [categories, setCategories] = useState<Record<string, DisputeCategory>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No open invoice disputes. Decided disputes leave this queue
        automatically.
      </div>
    );
  }

  function decide(disputeId: string, decision: "conceded" | "rejected") {
    const category = categories[disputeId];
    const reason = reasons[disputeId] ?? "";
    if (!category) {
      setErrors((prev) => ({
        ...prev,
        [disputeId]: "Pick a D1–D5 playbook category before deciding.",
      }));
      return;
    }
    if (reason.trim().length === 0) {
      setErrors((prev) => ({
        ...prev,
        [disputeId]: "A reason is required — every decision is documented.",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [disputeId]: null }));
    onDecide({ disputeId, decision, category, reason });
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const reasonId = `dispute-reason-${item.disputeId}`;
        const categoryId = `dispute-category-${item.disputeId}`;
        const category = categories[item.disputeId];
        const error = errors[item.disputeId];

        return (
          <li
            key={item.disputeId}
            className="space-y-4 rounded-xl border bg-background p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  Invoice {item.invoiceNumber}{" "}
                  <span className="text-muted-foreground">·</span>{" "}
                  <span className="text-muted-foreground">
                    {formatPounds(item.grossPence)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.propertyAddress} — applicant {item.applicantName}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{item.branchName}</p>
                <p className="text-muted-foreground">
                  Agent: {item.agentName}
                </p>
                <p className="text-muted-foreground">
                  Dispute raised {formatDate(item.raisedAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="bg-muted text-slate-700">
                Invoice state: {item.invoiceState}
              </Badge>
              <Badge
                className={
                  item.properlyRaised
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {item.properlyRaised
                  ? "Properly raised (clause 9.5)"
                  : "Late dispute — dunning clock did not pause"}
              </Badge>
              <Badge className="bg-muted text-slate-700">
                Issued {formatDate(item.issuedAt)}
              </Badge>
              <Badge className="bg-muted text-slate-700">
                Introduced {formatDate(item.occurredAt)}
              </Badge>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Grounds
              </p>
              <p className="mt-1 whitespace-pre-line">{item.grounds}</p>
            </div>

            {item.evidenceUrls.length > 0 && (
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
            )}

            <div className="space-y-2">
              <Label htmlFor={categoryId}>Playbook category</Label>
              <select
                id={categoryId}
                value={category ?? ""}
                onChange={(event) =>
                  setCategories((prev) => ({
                    ...prev,
                    [item.disputeId]: event.target.value as DisputeCategory,
                  }))
                }
                className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a category…</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {category && (
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_GUIDANCE[category]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={reasonId}>Decision reason</Label>
              <Textarea
                id={reasonId}
                value={reasons[item.disputeId] ?? ""}
                placeholder="Document the decision — this is sent to the agent and stored as evidence."
                onChange={(event) =>
                  setReasons((prev) => ({
                    ...prev,
                    [item.disputeId]: event.target.value,
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
                onClick={() => decide(item.disputeId, "rejected")}
              >
                Reject — dunning resumes
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => decide(item.disputeId, "conceded")}
              >
                Concede — cancel invoice
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
