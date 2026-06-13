"use client";

/**
 * JobDetailView — Client Component
 *
 * Two-column layout:
 *   Left  — job header, scope of work, message placeholder, timeline
 *   Right — status panel (with transitions), quote summary, invoice, review
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Tag, AlertCircle, Star, MessageSquare } from "lucide-react";
import type { JobDetail } from "@/services/provider/provider-job-service";
import { JobTimeline } from "./JobTimeline";

// ---------------------------------------------------------------------------
// Types for sidebar supplemental data
// ---------------------------------------------------------------------------

export type JobSidebarData = Readonly<{
  quote: {
    exists: boolean;
    totalPence: number | null;
    lineCount: number;
  };
  invoice: {
    exists: boolean;
    number: string | null;
    status: string | null;
  };
  review: {
    exists: boolean;
    rating: number | null;
    comment: string | null;
  };
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type StatusStyle = { label: string; className: string };

function getStatusStyle(status: string): StatusStyle {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-700" };
    case "confirmed":
    case "active":
      return { label: status === "confirmed" ? "Confirmed" : "Active", className: "bg-blue-100 text-blue-700" };
    case "in_progress":
      return { label: "In Progress", className: "bg-purple-100 text-purple-700" };
    case "completed":
      return { label: "Completed", className: "bg-green-100 text-green-700" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-red-100 text-red-700" };
    default:
      return { label: status, className: "bg-neutral-100 text-neutral-700" };
  }
}

// ---------------------------------------------------------------------------
// Status transition config
// ---------------------------------------------------------------------------

type Transition = { label: string; next: string; variant: "primary" | "danger" };

const STATUS_TRANSITIONS: Record<string, Transition[]> = {
  pending: [
    { label: "Confirm Job", next: "confirmed", variant: "primary" },
    { label: "Cancel", next: "cancelled", variant: "danger" },
  ],
  confirmed: [
    { label: "Start Work", next: "in_progress", variant: "primary" },
    { label: "Cancel", next: "cancelled", variant: "danger" },
  ],
  in_progress: [
    { label: "Mark Complete", next: "completed", variant: "primary" },
  ],
  completed: [],
  cancelled: [],
  active: [
    { label: "Start Work", next: "in_progress", variant: "primary" },
    { label: "Cancel", next: "cancelled", variant: "danger" },
  ],
};

// ---------------------------------------------------------------------------
// Status Panel (sidebar)
// ---------------------------------------------------------------------------

function StatusPanel({
  jobId,
  status,
}: Readonly<{ jobId: string; status: string }>) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];
  const { label, className } = getStatusStyle(currentStatus);

  async function handleTransition(next: string) {
    setError(null);
    try {
      const res = await fetch(`/api/provider/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update status");
      }
      startTransition(() => {
        setCurrentStatus(next);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-neutral-900">Job Status</h2>
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${className}`}>
          {label}
        </span>
      </div>

      {transitions.length > 0 && (
        <div className="flex flex-col gap-2">
          {transitions.map((t) => (
            <button
              key={t.next}
              onClick={() => handleTransition(t.next)}
              disabled={isPending}
              className={[
                "w-full rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
                t.variant === "primary"
                  ? "bg-brand-primary text-white hover:bg-[#163d31]"
                  : "border border-red-300 bg-white text-red-600 hover:bg-red-50",
              ].join(" ")}
            >
              {isPending ? "Updating…" : t.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quote Summary (sidebar)
// ---------------------------------------------------------------------------

function QuoteSummary({
  jobId,
  quote,
}: Readonly<{ jobId: string; quote: JobSidebarData["quote"] }>) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900">Quote</h2>
      {quote.exists ? (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-neutral-900">
            {quote.totalPence != null ? formatAmount(quote.totalPence) : "—"}
          </p>
          <p className="text-xs text-neutral-500">
            {quote.lineCount} line item{quote.lineCount !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">No quote submitted yet.</p>
          <Link
            href={`/dashboard/provider/quotes/new?jobId=${jobId}`}
            className="inline-block rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#163d31] transition"
          >
            Create Quote
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice (sidebar)
// ---------------------------------------------------------------------------

function InvoicePanel({
  jobId,
  status: jobStatus,
  invoice,
}: Readonly<{
  jobId: string;
  status: string;
  invoice: JobSidebarData["invoice"];
}>) {
  const isComplete = jobStatus === "completed";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900">Invoice</h2>
      {invoice.exists ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-900">
            #{invoice.number ?? "—"}
          </p>
          <span
            className={[
              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
              invoice.status === "paid"
                ? "bg-green-100 text-green-700"
                : invoice.status === "sent"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-neutral-100 text-neutral-600",
            ].join(" ")}
          >
            {invoice.status ?? "draft"}
          </span>
        </div>
      ) : isComplete ? (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">Job complete — no invoice yet.</p>
          <Link
            href={`/dashboard/provider/jobs/${jobId}/invoice/new`}
            className="inline-block rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#163d31] transition"
          >
            Generate Invoice
          </Link>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">Invoice will be available once the job is complete.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review (sidebar)
// ---------------------------------------------------------------------------

function ReviewPanel({
  jobId,
  review,
}: Readonly<{ jobId: string; review: JobSidebarData["review"] }>) {
  function StarRating({ rating }: Readonly<{ rating: number }>) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={[
              "size-4",
              n <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-neutral-200 text-neutral-200",
            ].join(" ")}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900">Review</h2>
      {review.exists && review.rating != null ? (
        <div className="space-y-2">
          <StarRating rating={review.rating} />
          {review.comment && (
            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">No review yet.</p>
          <button
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-surface transition"
            onClick={() => {
              // Placeholder: request review flow not yet built
              alert(`Review request for job ${jobId} — coming soon`);
            }}
          >
            Request Review
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function JobDetailView({
  job,
  sidebar,
}: Readonly<{
  job: JobDetail;
  sidebar: JobSidebarData;
}>) {
  const { label: statusLabel, className: statusClass } = getStatusStyle(job.status);

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/provider/jobs/active"
          className="text-sm text-brand-primary hover:underline"
        >
          ← Back to Active Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{job.serviceType}</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Client: <span className="font-medium text-neutral-700">{job.client.name}</span>
                  {" · "}
                  Posted {formatDate(job.createdAt)}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Scope of Work</h2>

            <p className="text-sm text-neutral-700 leading-relaxed">
              {job.description || "No description provided."}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Budget */}
              {job.agreedPricePence != null && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-400">Agreed Price</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatAmount(job.agreedPricePence)}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {job.address.postcode && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-400">Location</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {[job.address.line1, job.address.city, job.address.postcode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Category</p>
                  <p className="text-sm font-medium text-neutral-900">{job.serviceType}</p>
                </div>
              </div>

              {/* Scheduled date */}
              {job.scheduledAt && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-400">Scheduled</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDate(job.scheduledAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message placeholder */}
          <div className="rounded-xl border border-dashed border-neutral-200 bg-surface p-6 flex items-center gap-3">
            <MessageSquare className="size-5 text-neutral-300 shrink-0" />
            <p className="text-sm text-neutral-400">Message history coming soon</p>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Job Timeline</h2>
            <JobTimeline status={job.status} timeline={job.timeline} />
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <StatusPanel jobId={job.id} status={job.status} />
          <QuoteSummary jobId={job.id} quote={sidebar.quote} />
          <InvoicePanel jobId={job.id} status={job.status} invoice={sidebar.invoice} />
          <ReviewPanel jobId={job.id} review={sidebar.review} />
        </div>
      </div>
    </div>
  );
}
