"use client";

/**
 * JobDetailView — Client Component
 *
 * Two-column layout matching Stitch job-detail design:
 *   Left  — breadcrumb + job header, description + issue docs, project activity timeline
 *   Right — client contact card, location, documents, status actions
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
  Phone,
  Mail,
  MessageSquare,
  Share2,
  ChevronRight,
  Upload,
  FileText,
  Receipt,
  CheckCircle2,
  FolderOpen,
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
      return { label: "Pending", className: "bg-warning-light text-warning border border-warning/20" };
    case "confirmed":
    case "active":
      return {
        label: status === "confirmed" ? "Confirmed" : "Active",
        className: "bg-success-light text-success border border-success/20",
      };
    case "in_progress":
      return { label: "In Progress", className: "bg-success-light text-success border border-success/20" };
    case "completed":
      return { label: "Completed", className: "bg-brand-accent-light text-brand-accent border border-brand-accent/20" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-error-light text-error border border-error/20" };
    default:
      return { label: status, className: "bg-neutral-100 text-neutral-700 border border-neutral-200" };
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
// Client Contact Card (sidebar)
// ---------------------------------------------------------------------------

function ClientCard({ job }: Readonly<{ job: JobDetail }>) {
  const initials = job.client.name
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-warning-light flex items-center justify-center text-warning font-bold text-lg">
          {initials}
        </div>
        <div>
          <h4 className="text-base font-bold text-neutral-900">{job.client.name}</h4>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-tighter">Client</p>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <Phone className="size-4 text-neutral-400" />
          <span>Contact via messaging</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <Mail className="size-4 text-neutral-400" />
          <span className="truncate">{job.client.email ?? "No email on file"}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/dashboard/provider/messages`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-brand-primary font-bold text-sm hover:bg-neutral-50 transition-colors"
        >
          <Phone className="size-4" />
          Contact
        </Link>
        <Link
          href={`/dashboard/provider/messages`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-brand-primary font-bold text-sm hover:bg-neutral-50 transition-colors"
        >
          <MessageSquare className="size-4" />
          Message
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Location Section (sidebar)
// ---------------------------------------------------------------------------

function LocationCard({ job }: Readonly<{ job: JobDetail }>) {
  const addressLine = [job.address.line1, job.address.city, job.address.postcode]
    .filter(Boolean)
    .join(", ");

  if (!addressLine) return null;

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-6 pb-3">
        <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
          <MapPin className="size-4" />
          Job Location
        </h3>
      </div>
      <div className="h-32 bg-brand-primary-lighter relative flex items-center justify-center">
        <div className="bg-brand-primary text-white p-2 rounded-full shadow-lg ring-4 ring-white">
          <MapPin className="size-5" />
        </div>
      </div>
      <div className="p-4 bg-neutral-50 border-t border-neutral-200">
        <p className="text-xs font-bold text-neutral-900">{job.address.line1 ?? "Address"}</p>
        <p className="text-xs text-neutral-500">
          {[job.address.city, job.address.postcode].filter(Boolean).join(", ")}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Documents Card (sidebar)
// ---------------------------------------------------------------------------

function DocumentsCard({
  jobId,
  quote,
  invoice,
}: Readonly<{
  jobId: string;
  quote: JobSidebarData["quote"];
  invoice: JobSidebarData["invoice"];
}>) {
  return (
    <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
          <FolderOpen className="size-4" />
          Documents
        </h3>
        <button className="text-brand-primary text-xs font-bold hover:underline flex items-center gap-1">
          <Upload className="size-3" />
          Upload
        </button>
      </div>
      <div className="space-y-3">
        {/* Quote doc */}
        {quote.exists ? (
          <Link
            href={`/dashboard/provider/quotes/new?jobId=${jobId}`}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary-lighter p-2 rounded-lg text-success">
                <FileText className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-700">
                  Quote #{quote.lineCount} item{quote.lineCount !== 1 ? "s" : ""}
                </p>
                {quote.totalPence != null && (
                  <p className="text-[10px] text-neutral-400">{formatAmount(quote.totalPence)}</p>
                )}
              </div>
            </div>
            <CheckCircle2 className="size-4 text-success" />
          </Link>
        ) : (
          <Link
            href={`/dashboard/provider/quotes/new?jobId=${jobId}`}
            className="flex items-center justify-between p-3 rounded-xl border border-dashed border-neutral-200 hover:border-success/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-neutral-100 p-2 rounded-lg text-neutral-400 group-hover:text-success transition-colors">
                <FileText className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-700">No Quote Yet</p>
                <p className="text-[10px] text-neutral-400">Tap to create a quote</p>
              </div>
            </div>
          </Link>
        )}

        {/* Invoice doc */}
        {invoice.exists ? (
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="bg-brand-accent-light p-2 rounded-lg text-brand-accent">
                <Receipt className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-700">Invoice #{invoice.number ?? "—"}</p>
                <p className="text-[10px] text-neutral-400 capitalize">{invoice.status ?? "draft"}</p>
              </div>
            </div>
            <CheckCircle2 className="size-4 text-brand-accent" />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-neutral-200 opacity-60">
            <div className="flex items-center gap-3">
              <div className="bg-neutral-100 p-2 rounded-lg text-neutral-400">
                <Receipt className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-700">Invoice</p>
                <p className="text-[10px] text-neutral-400">Available on completion</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

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
    <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest">Job Status</h3>
      <div>
        <span className={["inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", className].join(" ")}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
                "w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50",
                t.variant === "primary"
                  ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                  : "border border-error/20 bg-white text-error hover:bg-error-light",
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
    </section>
  );
}

// ---------------------------------------------------------------------------
// Star Rating (shared helper)
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
              ? "fill-warning text-warning"
              : "fill-neutral-200 text-neutral-200",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Panel (sidebar)
// ---------------------------------------------------------------------------

function ReviewPanel({
  jobId,
  review,
}: Readonly<{ jobId: string; review: JobSidebarData["review"] }>) {
  return (
    <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest">Review</h3>
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
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition"
            onClick={() => {
              // Placeholder: request review flow not yet built
              alert(`Review request for job ${jobId} — coming soon`);
            }}
          >
            Request Review
          </button>
        </div>
      )}
    </section>
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
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Link href="/dashboard/provider/jobs/active" className="hover:text-brand-primary transition-colors">
              Jobs
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-neutral-500">{job.id.slice(0, 8).toUpperCase()}</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading tracking-tight">
            {job.serviceType} at{" "}
            {[job.address.line1, job.address.city].filter(Boolean).join(", ") || "Client Property"}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", statusClass].join(" ")}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
            <span className="text-neutral-500 text-sm flex items-center gap-1 font-medium">
              <span className="text-neutral-400">Client:</span>
              {job.client.name}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-all flex items-center gap-2">
            <Share2 className="size-4" />
            Share
          </button>
          <button className="px-5 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-brand-primary/90 transition-all flex items-center gap-2">
            Manage Job
          </button>
        </div>
      </div>

      {/* ── Dashboard Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description + Issue Documentation Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Description */}
            <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="size-4" />
                Project Description
              </h3>
              <p className="text-neutral-600 leading-relaxed text-sm">
                {job.description || "No description provided."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full text-xs font-semibold">
                  {job.serviceType}
                </span>
                {job.agreedPricePence != null && (
                  <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full text-xs font-semibold">
                    {formatAmount(job.agreedPricePence)}
                  </span>
                )}
                {job.scheduledAt && (
                  <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full text-xs font-semibold">
                    <Calendar className="size-3 inline mr-1" />
                    {formatDate(job.scheduledAt)}
                  </span>
                )}
              </div>
            </section>

            {/* Scope of Work Details */}
            <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Tag className="size-4" />
                Job Details
              </h3>
              <div className="space-y-4">
                {job.agreedPricePence != null && (
                  <div className="flex items-start gap-3">
                    <Tag className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-400">Agreed Price</p>
                      <p className="text-sm font-bold text-neutral-900">
                        {formatAmount(job.agreedPricePence)}
                      </p>
                    </div>
                  </div>
                )}
                {job.address.postcode && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-400">Location</p>
                      <p className="text-sm font-bold text-neutral-900">
                        {[job.address.line1, job.address.city, job.address.postcode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-400">Category</p>
                    <p className="text-sm font-bold text-neutral-900">{job.serviceType}</p>
                  </div>
                </div>
                {job.scheduledAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-400">Scheduled</p>
                      <p className="text-sm font-bold text-neutral-900">{formatDate(job.scheduledAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Project Activity Log / Timeline */}
          <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 pointer-events-none select-none">
              <span className="text-8xl text-neutral-100 -rotate-12 block">⏱</span>
            </div>
            <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
              Project Activity
            </h3>
            <div className="relative z-10">
              <JobTimeline status={job.status} timeline={job.timeline} />
            </div>
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Status Actions */}
          <StatusPanel jobId={job.id} status={job.status} />

          {/* Client Contact */}
          <ClientCard job={job} />

          {/* Location */}
          <LocationCard job={job} />

          {/* Documents */}
          <DocumentsCard jobId={job.id} quote={sidebar.quote} invoice={sidebar.invoice} />

          {/* Review */}
          <ReviewPanel jobId={job.id} review={sidebar.review} />
        </div>
      </div>
    </div>
  );
}
