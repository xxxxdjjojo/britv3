"use client";

import { useState } from "react";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { acceptLead, declineLead } from "@/services/provider/provider-job-service";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Wrench,
  MessageSquare,
  CheckCircle,
  XCircle,
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
      return { label: "Urgent", className: "bg-error-light text-error" };
    case "high":
      return { label: "High Priority", className: "bg-warning-light text-warning" };
    case "medium":
      return { label: "Medium", className: "bg-neutral-100 text-neutral-600" };
    case "low":
      return { label: "Low Priority", className: "bg-success-light text-success" };
    default:
      return { label: "New", className: "bg-neutral-100 text-neutral-600" };
  }
}

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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
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
// JobLeadCard
// ---------------------------------------------------------------------------

type JobLeadCardProps = Readonly<{
  lead: ProviderLead;
  providerId: string;
  /** Called when the lead is accepted or declined so parent can remove card */
  onRemove: (leadId: string) => void;
}>;

export function JobLeadCard({ lead, providerId, onRemove }: JobLeadCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badge = urgencyBadge(lead.serviceCategory); // we don't have urgency in ProviderLead, use category as label

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

  return (
    <>
      {showDeclineDialog && (
        <DeclineDialog
          onConfirm={handleDecline}
          onCancel={() => setShowDeclineDialog(false)}
          loading={declining}
        />
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Category icon avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
              <Wrench className="size-5 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {lead.serviceCategory}
              </p>
              <p className="text-xs text-neutral-500">{lead.clientName}</p>
            </div>
          </div>

          {/* Urgency badge — we show category as the label since urgency isn't in ProviderLead type */}
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            New Lead
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-neutral-600 line-clamp-2">{lead.description}</p>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {lead.location || "Location TBC"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {relativeTime(lead.createdAt)}
          </span>
          <span className="font-medium text-neutral-700">
            {formatBudget(lead.budgetMinPence, lead.budgetMaxPence)}
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-2 text-xs text-error">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={handleAccept}
            disabled={accepting || declining}
          >
            <CheckCircle className="mr-1.5 size-4" />
            {accepting ? "Accepting…" : "Accept Lead"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-neutral-200"
            onClick={() => setShowDeclineDialog(true)}
            disabled={accepting || declining}
          >
            <XCircle className="mr-1.5 size-4" />
            Decline
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="px-3"
            aria-label="Message client"
            disabled={accepting || declining}
          >
            <MessageSquare className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
