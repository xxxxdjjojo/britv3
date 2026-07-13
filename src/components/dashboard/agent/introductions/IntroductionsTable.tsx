"use client";

/**
 * IntroductionsTable — agent introductions-ledger table (Truedeed Phase 1, §6).
 *
 * Props-driven client component; data fetched by parents. Renders one row per
 * introduction with the humanised contact type, a status badge, and the
 * rebuttal window (deadline + Dispute button while open, "Window closed"
 * copy otherwise, "Under review" while a rebuttal is pending).
 */

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
import { formatDate } from "@/lib/formatters";
import type {
  AgentIntroduction,
  IntroductionContactType,
  IntroductionStatus,
} from "@/types/truedeed";

const CONTACT_TYPE_LABELS: Record<IntroductionContactType, string> = {
  enquiry: "Enquiry",
  viewing_request: "Viewing request",
  message: "Message",
};

/** Badge colours follow repo conventions: green active, red rebutted, blue converted, gray expired/cancelled. */
const STATUS_BADGES: Record<IntroductionStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  rebutted: { label: "Rebutted", className: "bg-red-100 text-red-700" },
  cancelled_manifest_error: { label: "Cancelled", className: "bg-muted text-gray-600" },
  converted_sstc: { label: "SSTC", className: "bg-blue-100 text-blue-700" },
  converted_exchanged: { label: "Exchanged", className: "bg-blue-100 text-blue-700" },
  converted_completed: { label: "Completed", className: "bg-blue-100 text-blue-700" },
  expired: { label: "Expired", className: "bg-muted text-gray-600" },
};

export type IntroductionRow = AgentIntroduction & {
  /** True while a submitted rebuttal awaits an admin decision. */
  underReview?: boolean;
};

/** Statuses on which an agent can report (or update) an outcome. */
const OUTCOME_REPORTABLE_STATUSES: ReadonlySet<IntroductionStatus> = new Set([
  "active",
  "converted_sstc",
  "converted_exchanged",
  "converted_completed",
]);

type Props = Readonly<{
  introductions: IntroductionRow[];
  onSelect: (id: string) => void;
  /** Optional dedicated dispute handler; falls back to onSelect. */
  onDispute?: (id: string) => void;
  /** When provided, qualifying rows show a "Report outcome" button. */
  onReportOutcome?: (id: string) => void;
}>;

export function IntroductionsTable({
  introductions,
  onSelect,
  onDispute,
  onReportOutcome,
}: Props) {
  if (introductions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No introductions yet. When an applicant first contacts you about a
        listing, it will be recorded here.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
    <Table className="min-w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Applicant</TableHead>
          <TableHead>Listing</TableHead>
          <TableHead>Contact type</TableHead>
          <TableHead>Occurred</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rebuttal window</TableHead>
          {onReportOutcome && <TableHead>Outcome</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {introductions.map((intro) => {
          const badge = STATUS_BADGES[intro.status];
          return (
            <TableRow
              key={intro.id}
              className="cursor-pointer"
              onClick={() => onSelect(intro.id)}
            >
              <TableCell className="font-medium">{intro.applicantName}</TableCell>
              <TableCell>{intro.listingAddress}</TableCell>
              <TableCell>{CONTACT_TYPE_LABELS[intro.contactType]}</TableCell>
              <TableCell>{formatDate(intro.occurredAt)}</TableCell>
              <TableCell>
                <Badge className={badge.className}>{badge.label}</Badge>
              </TableCell>
              <TableCell>
                <RebuttalWindowCell
                  intro={intro}
                  onDispute={onDispute ?? onSelect}
                />
              </TableCell>
              {onReportOutcome && (
                <TableCell>
                  {OUTCOME_REPORTABLE_STATUSES.has(intro.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReportOutcome(intro.id);
                      }}
                    >
                      Report outcome
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
}

function RebuttalWindowCell({
  intro,
  onDispute,
}: Readonly<{ intro: IntroductionRow; onDispute: (id: string) => void }>) {
  if (intro.underReview) {
    return <span className="text-sm text-amber-700">Under review</span>;
  }

  if (intro.rebuttalOpen && intro.rebuttalDeadline) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Dispute by {formatDate(intro.rebuttalDeadline)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onDispute(intro.id);
          }}
        >
          Dispute
        </Button>
      </div>
    );
  }

  return <span className="text-sm text-muted-foreground">Window closed</span>;
}
