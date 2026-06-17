"use client";

/**
 * AgentInvoicesTable — client invoices table for the Truedeed billing page.
 *
 * Owns the DisputeInvoiceModal state. Each row decides whether to render the
 * "Dispute this invoice" affordance: shown for active states (open /
 * collecting / overdue / final_notice / suspended) when no dispute exists
 * yet, hidden once a dispute is recorded (the row badge already shows
 * "Disputed"), suspended once the invoice is paid / cancelled / charged
 * back.
 *
 * Submission posts FormData multipart to /api/truedeed/disputes; the API
 * route maps service errors to HTTP 4xx. On success the page refreshes via
 * router.refresh() so the row's status reflects the new dispute.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DisputeInvoiceModal,
  type DisputeSubmission,
} from "./DisputeInvoiceModal";

export type AgentInvoiceRow = {
  id: string;
  invoiceNumber: string;
  grossPence: number;
  dueAt: string;
  issuedAt: string;
  state: string;
  propertyAddress: string;
  /** Has a dispute row already (don't offer the button). */
  hasDispute: boolean;
  /** Inside the 10-business-day clause 9.5 window. */
  windowOpen: boolean;
  /** ISO datetime: end of the clause 9.5 window. */
  windowEnd: string;
};

type Props = Readonly<{
  invoices: AgentInvoiceRow[];
}>;

const DISPUTABLE_STATES = new Set([
  "open",
  "collecting",
  "overdue",
  "final_notice",
  "suspended",
]);

const STATE_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-muted text-slate-700" },
  collecting: { label: "Collecting", className: "bg-blue-100 text-blue-700" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Overdue", className: "bg-amber-100 text-amber-800" },
  final_notice: {
    label: "Final notice",
    className: "bg-orange-100 text-orange-800",
  },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700" },
  disputed: { label: "Disputed", className: "bg-violet-100 text-violet-700" },
  cancelled: { label: "Cancelled", className: "bg-muted text-slate-500" },
  charged_back: { label: "Charged back", className: "bg-red-100 text-red-700" },
};

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Europe/London",
});

function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function AgentInvoicesTable({ invoices }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<AgentInvoiceRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No invoices yet.</p>
    );
  }

  async function handleSubmit(submission: DisputeSubmission) {
    if (!open) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const form = new FormData();
      form.set("invoiceId", open.id);
      form.set("grounds", submission.grounds);
      for (const file of submission.files) {
        form.append("evidence", file, file.name);
      }
      const response = await fetch("/api/truedeed/disputes", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        let message = "Could not raise the dispute. Please try again.";
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload?.error) {
            message = mapErrorMessage(payload.error);
          }
        } catch {
          /* swallow JSON parse — keep default */
        }
        setServerError(message);
        return;
      }
      setOpen(null);
      router.refresh();
    } catch {
      setServerError("Network error — your dispute was not submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Property</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const badge = STATE_BADGES[invoice.state] ?? {
              label: invoice.state,
              className: "bg-muted text-slate-700",
            };
            const canDispute =
              DISPUTABLE_STATES.has(invoice.state) && !invoice.hasDispute;
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.propertyAddress || "—"}</TableCell>
                <TableCell className="text-right">
                  {formatPounds(invoice.grossPence)}
                </TableCell>
                <TableCell>
                  {EN_GB_DATE.format(new Date(invoice.dueAt))}
                </TableCell>
                <TableCell>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canDispute ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setServerError(null);
                        setOpen(invoice);
                      }}
                    >
                      Dispute
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {open && (
        <DisputeInvoiceModal
          invoice={{
            id: open.id,
            invoiceNumber: open.invoiceNumber,
            propertyAddress: open.propertyAddress || "the listed property",
            issuedAt: open.issuedAt,
            windowOpen: open.windowOpen,
            windowEnd: open.windowEnd,
          }}
          open
          onClose={() => {
            if (!submitting) setOpen(null);
          }}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          serverError={serverError}
        />
      )}
    </>
  );
}

function mapErrorMessage(code: string): string {
  switch (code) {
    case "grounds_required":
      return "Please provide grounds for the dispute.";
    case "not_authorised":
      return "You can only dispute invoices billed to your branch.";
    case "not_found":
      return "We couldn't find that invoice.";
    case "already_disputed":
      return "This invoice already has a dispute open.";
    case "upload_failed":
      return "One of your evidence files couldn't be uploaded.";
    default:
      return "Could not raise the dispute. Please try again.";
  }
}
