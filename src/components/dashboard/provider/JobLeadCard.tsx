"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { acceptLead, declineLead } from "@/services/provider/provider-job-service";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Wrench,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  X,
  MoreVertical,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBudget(minPence: number | null, maxPence: number | null): string {
  if (minPence == null && maxPence == null) return "Budget TBC";
  const fmt = (p: number) => `£${(p / 100).toLocaleString("en-GB")}`;
  if (minPence != null && maxPence != null) return `${fmt(minPence)}–${fmt(maxPence)}`;
  if (minPence != null) return `From ${fmt(minPence)}`;
  if (maxPence != null) return `Up to ${fmt(maxPence!)}`;
  return "Budget TBC";
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

type UrgencyLevel = "urgent" | "high" | "medium" | "low" | string;

function urgencyBadge(urgency: UrgencyLevel): { label: string; className: string } {
  switch (urgency) {
    case "urgent":
      return { label: "Urgent", className: "bg-red-100 text-red-700" };
    case "high":
      return { label: "High Priority", className: "bg-amber-100 text-amber-700" };
    case "medium":
      return { label: "Medium", className: "bg-neutral-100 text-neutral-600" };
    case "low":
      return { label: "Low Priority", className: "bg-green-100 text-green-700" };
    default:
      return { label: "New", className: "bg-neutral-100 text-neutral-600" };
  }
}

/** Derive a visual urgency tier from lead status / timing for display variety */
function deriveUrgencyTier(lead: ProviderLead): "emergency" | "urgent" | "standard" | "future" {
  if (lead.status === "urgent") return "emergency";
  const ageHrs =
    (Date.now() - new Date(lead.createdAt).getTime()) / (1_000 * 60 * 60);
  if (ageHrs < 1) return "emergency";
  if (ageHrs < 6) return "urgent";
  // expiresAt far in future → treat as future / standard
  const expiresIn =
    (new Date(lead.expiresAt).getTime() - Date.now()) / (1_000 * 60 * 60);
  if (expiresIn > 36) return "future";
  return "standard";
}

type UrgencyTier = "emergency" | "urgent" | "standard" | "future";

const URGENCY_CHIP: Record<UrgencyTier, { label: string; className: string }> = {
  emergency: { label: "Emergency", className: "bg-red-600 text-white" },
  urgent: { label: "Urgent", className: "bg-amber-500 text-white" },
  standard: { label: "Standard", className: "bg-neutral-200 text-neutral-700" },
  future: { label: "Future", className: "bg-brand-primary/10 text-brand-primary" },
};

// ---------------------------------------------------------------------------
// Decline confirm dialog
// ---------------------------------------------------------------------------

function DeclineDialog(props: Readonly<{
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}>) {
  const [reason, setReason] = useState("Not available");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-neutral-900">Decline lead?</h3>
        <p className="mt-1 text-sm text-neutral-500">
          This lead will be removed from your list. Please provide a reason.
        </p>
        <select
          className="mt-4 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option>Not available</option>
          <option>Outside my service area</option>
          <option>Budget too low</option>
          <option>Not my specialism</option>
          <option>Other</option>
        </select>
        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={props.onCancel}
            disabled={props.loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
            onClick={() => props.onConfirm(reason)}
            disabled={props.loading}
          >
            {props.loading ? "Declining…" : "Decline"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobLeadCard — Hero variant (first / featured lead)
// ---------------------------------------------------------------------------

function HeroLeadCard({
  lead,
  urgencyTier,
  accepting,
  declining,
  error,
  onAccept,
  onDeclineOpen,
  onDismiss,
}: Readonly<{
  lead: ProviderLead;
  urgencyTier: UrgencyTier;
  accepting: boolean;
  declining: boolean;
  error: string | null;
  onAccept: () => void;
  onDeclineOpen: () => void;
  onDismiss: () => void;
}>) {
  const chip = URGENCY_CHIP[urgencyTier];
  const badge = urgencyBadge(lead.serviceCategory);

  return (
    <div className="relative rounded-xl border border-neutral-200 bg-white p-6 shadow-md transition hover:shadow-lg">
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        aria-label="Dismiss lead"
      >
        <X className="size-4" />
      </button>

      {/* Header row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          {/* Chips row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${chip.className}`}>
              {chip.label}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
              New Lead
            </span>
            <span className="ml-auto text-xs text-neutral-400">
              Posted {relativeTime(lead.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-neutral-900 leading-snug">
            {lead.serviceCategory}
          </h3>

          {/* Description */}
          <p className="mt-1.5 text-sm text-neutral-600 line-clamp-2">{lead.description}</p>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {lead.location || "Location TBC"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {relativeTime(lead.createdAt)}
            </span>
            <span className="font-medium text-neutral-700">
              Est. Budget: {formatBudget(lead.budgetMinPence, lead.budgetMaxPence)}
            </span>
          </div>
        </div>

        {/* CTA column */}
        <div className="flex shrink-0 flex-col items-stretch gap-2 md:w-36">
          <Button
            size="sm"
            className="w-full bg-brand-primary text-white hover:bg-[#163d31]"
            onClick={onAccept}
            disabled={accepting || declining}
          >
            <CheckCircle className="mr-1.5 size-4" />
            {accepting ? "Accepting…" : "Accept Lead"}
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full border-neutral-200"
          >
            <Link href={`/dashboard/provider/quotes/builder?request_id=${lead.id}`}>
              <FileText className="mr-1.5 size-4" />
              Send Quote
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-neutral-200"
            onClick={onDeclineOpen}
            disabled={accepting || declining}
          >
            <XCircle className="mr-1.5 size-4" />
            Decline
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full"
          >
            <Link href="/inbox" aria-label="Message client">
              <MessageSquare className="mr-1.5 size-4" />
              Message
            </Link>
          </Button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobLeadCard — Grid variant (compact two-column card)
// ---------------------------------------------------------------------------

function GridLeadCard({
  lead,
  urgencyTier,
  accepting,
  declining,
  error,
  onAccept,
  onDeclineOpen,
}: Readonly<{
  lead: ProviderLead;
  urgencyTier: UrgencyTier;
  accepting: boolean;
  declining: boolean;
  error: string | null;
  onAccept: () => void;
  onDeclineOpen: () => void;
}>) {
  const chip = URGENCY_CHIP[urgencyTier];

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Top row: urgency chip + posted time */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${chip.className}`}>
          {chip.label}
        </span>
        <span className="text-[11px] text-neutral-400">
          Posted {relativeTime(lead.createdAt)}
        </span>
      </div>

      {/* Category + icon */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
          <Wrench className="size-4 text-brand-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 leading-snug">
            {lead.serviceCategory}
          </p>
          <p className="text-xs text-neutral-500">{lead.clientName}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-600 line-clamp-2 flex-1">{lead.description}</p>

      {/* Budget + location columns */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="font-bold uppercase tracking-wide text-neutral-400 mb-0.5">Budget</p>
          <p className="font-medium text-neutral-700">
            {formatBudget(lead.budgetMinPence, lead.budgetMaxPence)}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-neutral-400 mb-0.5">Location</p>
          <p className="font-medium text-neutral-700 truncate">
            {lead.location || "Location TBC"}
          </p>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Action row */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800"
          onClick={onAccept}
          disabled={accepting || declining}
        >
          <CheckCircle className="mr-1.5 size-4" />
          {accepting ? "Accepting…" : "Accept Lead"}
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-neutral-200"
        >
          <Link href={`/dashboard/provider/quotes/builder?request_id=${lead.id}`}>
            <FileText className="mr-1.5 size-4" />
            Quote
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="px-2.5"
          aria-label="More options"
          disabled={accepting || declining}
          onClick={onDeclineOpen}
        >
          <MoreVertical className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobLeadCard — public export
// ---------------------------------------------------------------------------

type JobLeadCardProps = Readonly<{
  lead: ProviderLead;
  providerId: string;
  /** Called when the lead is accepted or declined so parent can remove card */
  onRemove: (leadId: string) => void;
  /** Visual variant: hero = featured full-width card; grid = compact card */
  variant?: "hero" | "grid";
}>;

export function JobLeadCard({ lead, providerId, onRemove, variant = "grid" }: JobLeadCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urgencyTier = deriveUrgencyTier(lead);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const supabase = createClient();
      await acceptLead(lead.id, providerId, supabase);
      onRemove(lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept lead");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline(reason: string) {
    setDeclining(true);
    setError(null);
    try {
      const supabase = createClient();
      await declineLead(lead.id, providerId, reason, supabase);
      onRemove(lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline lead");
      setShowDeclineDialog(false);
    } finally {
      setDeclining(false);
    }
  }

  const sharedProps = {
    lead,
    urgencyTier,
    accepting,
    declining,
    error,
    onAccept: handleAccept,
    onDeclineOpen: () => setShowDeclineDialog(true),
  };

  return (
    <>
      {showDeclineDialog && (
        <DeclineDialog
          onConfirm={handleDecline}
          onCancel={() => setShowDeclineDialog(false)}
          loading={declining}
        />
      )}

      {variant === "hero" ? (
        <HeroLeadCard
          {...sharedProps}
          onDismiss={() => onRemove(lead.id)}
        />
      ) : (
        <GridLeadCard {...sharedProps} />
      )}
    </>
  );
}
