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
import {
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Share2,
  Upload,
  FileText,
} from "lucide-react";
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
      return { label: "Pending", className: "bg-warning/10 text-warning" };
    case "confirmed":
    case "active":
      return {
        label: status === "confirmed" ? "Confirmed" : "Active",
        className: "bg-info/10 text-info",
      };
    case "in_progress":
      return { label: "In Progress", className: "bg-success/10 text-success" };
    case "completed":
      return { label: "Completed", className: "bg-success/10 text-success" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-error/10 text-error" };
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
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
        Job Status
      </h2>
      <div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${className}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {label}
        </span>
      </div>

      {transitions.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          {transitions.map((t) => (
            <button
              key={t.next}
              onClick={() => handleTransition(t.next)}
              disabled={isPending}
              className={[
                "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
                t.variant === "primary"
                  ? "bg-brand-gold text-brand-gold-foreground hover:brightness-95"
                  : "border border-error/30 bg-white text-error hover:bg-error/5",
              ].join(" ")}
            >
              {isPending ? "Updating…" : t.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error">
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
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
        Quote
      </h2>
      {quote.exists ? (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-brand-primary-dark">
            {quote.totalPence != null ? formatAmount(quote.totalPence) : "—"}
          </p>
          <p className="text-xs text-neutral-500">
            {quote.lineCount} line item{quote.lineCount !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">No quote submitted yet.</p>
          <Link
            href={`/dashboard/provider/quotes/builder?jobId=${jobId}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-gold-foreground hover:brightness-95 transition w-full"
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
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
        Invoice
      </h2>
      {invoice.exists ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-neutral-400 shrink-0" />
            <p className="text-sm font-semibold text-neutral-900">
              #{invoice.number ?? "—"}
            </p>
          </div>
          <span
            className={[
              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
              invoice.status === "paid"
                ? "bg-success/10 text-success"
                : invoice.status === "sent"
                  ? "bg-info/10 text-info"
                  : "bg-neutral-100 text-neutral-600",
            ].join(" ")}
          >
            {invoice.status ?? "draft"}
          </span>
        </div>
      ) : isComplete ? (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">Job complete — no invoice yet.</p>
          <Link
            href={`/dashboard/provider/payments?jobId=${jobId}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-gold-foreground hover:brightness-95 transition w-full"
          >
            Generate Invoice
          </Link>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Invoice will be available once the job is complete.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review (sidebar)
// ---------------------------------------------------------------------------

function StarRating({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={[
            "size-4",
            n <= rating
              ? "fill-brand-gold text-brand-gold"
              : "fill-neutral-200 text-neutral-200",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function ReviewPanel({
  jobId,
  review,
}: Readonly<{ jobId: string; review: JobSidebarData["review"] }>) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
        Review
      </h2>
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
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">No review yet.</p>
          <button
            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-surface transition"
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
// Client Contact Card (sidebar)
// ---------------------------------------------------------------------------

function ClientContactCard({
  name,
}: Readonly<{ name: string }>) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-brand-primary">
            {name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{name}</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-[0.08em] font-medium">
            Landlord / Owner
          </p>
        </div>
      </div>

      {/* Contact rows */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Phone className="size-3.5 shrink-0 text-neutral-400" />
          <span>Contact via platform</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Mail className="size-3.5 shrink-0 text-neutral-400" />
          <span>Message in thread</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <Link
          href="/inbox"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-center text-xs font-semibold text-neutral-700 hover:bg-surface transition"
        >
          Call
        </Link>
        <Link
          href="/inbox"
          className="flex-1 rounded-lg bg-brand-primary px-3 py-2 text-center text-xs font-semibold text-white hover:bg-brand-primary-dark transition"
        >
          Message
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents Card (sidebar)
// ---------------------------------------------------------------------------

function DocumentsCard() {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
          Documents
        </h2>
        <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-brand-primary-dark transition">
          <Upload className="size-3" />
          Upload
        </button>
      </div>
      {/* Placeholder document rows — presentational only */}
      <div className="space-y-2">
        {[
          { name: "Gas Safety Record", tag: "Required" },
          { name: "Service History.pdf", tag: "Uploaded" },
        ].map((doc) => (
          <div
            key={doc.name}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 shrink-0 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-700 truncate">
                {doc.name}
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-neutral-400">
              {doc.tag}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-neutral-400">
        Upload job-related documents here.
      </p>
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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Link
          href="/dashboard/provider/jobs/active"
          className="hover:text-brand-primary transition-colors"
        >
          Jobs
        </Link>
        <span>/</span>
        <span className="text-neutral-600 font-medium">#{job.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          {/* Eyebrow */}
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Jobs
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-brand-primary-dark leading-tight">
            {job.serviceType}
          </h1>
          {/* Status pill + attribution row */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
            <span className="text-sm text-neutral-500">
              {job.client.name}
              {" · "}
              Posted {formatDate(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-surface transition shadow-sm">
            <Share2 className="size-4" />
            Share
          </button>
          <StatusPanel jobId={job.id} status={job.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Top pair: Scope of Work + Issue Documentation */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Scope of Work */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                Scope of Work
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {job.description || "No description provided."}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {job.serviceType && (
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-neutral-600">
                    {job.serviceType}
                  </span>
                )}
                {job.agreedPricePence != null && (
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-neutral-600">
                    {formatAmount(job.agreedPricePence)}
                  </span>
                )}
              </div>
            </div>

            {/* Issue Documentation (image gallery placeholder) */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                Issue Documentation
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square rounded-lg bg-surface border border-border flex items-center justify-center">
                  <MessageSquare className="size-6 text-neutral-300" />
                </div>
                <div className="aspect-square rounded-lg bg-surface border border-border flex items-center justify-center">
                  <MessageSquare className="size-6 text-neutral-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Scope meta row */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {/* Location */}
              {job.address.postcode && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-neutral-400 mb-0.5">
                      Location
                    </p>
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
                  <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-neutral-400 mb-0.5">
                    Category
                  </p>
                  <p className="text-sm font-medium text-neutral-900">{job.serviceType}</p>
                </div>
              </div>

              {/* Scheduled date */}
              {job.scheduledAt && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-neutral-400 mb-0.5">
                      Scheduled
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDate(job.scheduledAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Agreed price */}
              {job.agreedPricePence != null && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-neutral-400 mb-0.5">
                      Agreed Price
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatAmount(job.agreedPricePence)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message placeholder */}
          <div className="rounded-xl border border-dashed border-border bg-surface p-5 flex items-center gap-3">
            <MessageSquare className="size-5 text-neutral-300 shrink-0" />
            <p className="text-sm text-neutral-400">Message history coming soon</p>
          </div>

          {/* Job Timeline */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Job Timeline</h2>
            <JobTimeline status={job.status} timeline={job.timeline} />
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Client contact */}
          <ClientContactCard name={job.client.name} />

          {/* Job location */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="bg-surface border-b border-border aspect-video flex items-center justify-center">
              <div className="text-center space-y-1">
                <MapPin className="size-8 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-400">Map view</p>
              </div>
            </div>
            <div className="p-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500 mb-2">
                Job Location
              </p>
              <p className="text-sm font-medium text-neutral-900">
                {job.address.line1 || "—"}
              </p>
              <p className="text-xs text-neutral-500">
                {[job.address.city, job.address.postcode].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          {/* Documents */}
          <DocumentsCard />

          {/* Quote */}
          <QuoteSummary jobId={job.id} quote={sidebar.quote} />

          {/* Invoice */}
          <InvoicePanel jobId={job.id} status={job.status} invoice={sidebar.invoice} />

          {/* Review */}
          <ReviewPanel jobId={job.id} review={sidebar.review} />
        </div>
      </div>
    </div>
  );
}
