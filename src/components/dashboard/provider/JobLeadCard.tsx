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
  return `Up to ${fmt(maxPence!)}`;
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
            className="flex-1 bg-error text-white hover:bg-error/90"
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
  /** "card" = standalone card (default), "row" = row inside a parent article */
  layout?: "card" | "row";
}>;

export function JobLeadCard({ lead, providerId, onRemove, layout = "card" }: JobLeadCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isUrgent = lead.serviceCategory.toLowerCase().includes("emergency") ||
    lead.serviceCategory.toLowerCase().includes("urgent");

  const actionButtons = (
    <div className="flex items-center gap-3 shrink-0">
      <button
        className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        onClick={() => setShowDeclineDialog(true)}
        disabled={accepting || declining}
      >
        Decline
      </button>
      <Button
        size="sm"
        className="px-6 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-secondary/90 hover:shadow-md transition-all active:scale-95"
        onClick={handleAccept}
        disabled={accepting || declining}
      >
        <CheckCircle className="mr-1.5 size-4" />
        {accepting ? "Accepting…" : "Quote Lead"}
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
  );

  // Row layout (used inside parent <article> in the leads bento grid)
  if (layout === "row") {
    return (
      <>
        {showDeclineDialog && (
          <DeclineDialog
            onConfirm={handleDecline}
            onCancel={() => setShowDeclineDialog(false)}
            loading={declining}
          />
        )}

        <div className="flex items-start gap-5 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100 shrink-0">
            <Wrench className="size-6 text-neutral-400" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-neutral-900 truncate">
                {lead.serviceCategory}
              </h4>
              <span className={[
                "px-2 py-0.5 text-[10px] font-bold rounded shrink-0",
                isUrgent
                  ? "bg-warning-light text-warning"
                  : "bg-neutral-100 text-neutral-600",
              ].join(" ")}>
                {isUrgent ? "URGENT" : "STANDARD"}
              </span>
            </div>
            <p className="text-sm text-neutral-500 line-clamp-1">{lead.description}</p>
            <div className="flex gap-4 pt-1">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                <MapPin className="size-3" />
                {lead.location || "Location TBC"}
              </span>
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                <Clock className="size-3" />
                {relativeTime(lead.createdAt)}
              </span>
              <span className="text-xs font-medium text-neutral-600">
                {formatBudget(lead.budgetMinPence, lead.budgetMaxPence)}
              </span>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-error shrink-0">{error}</p>}
        {actionButtons}
      </>
    );
  }

  // Default card layout
  return (
    <>
      {showDeclineDialog && (
        <DeclineDialog
          onConfirm={handleDecline}
          onCancel={() => setShowDeclineDialog(false)}
          loading={declining}
        />
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col gap-4">
        {/* Header row */}
        <div className="flex justify-between items-start">
          <span className={[
            "px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded",
            isUrgent ? "bg-warning-light text-warning" : "bg-neutral-100 text-neutral-500",
          ].join(" ")}>
            {isUrgent ? "URGENT" : "STANDARD"}
          </span>
          <span className="text-xs font-medium text-neutral-400">
            {relativeTime(lead.createdAt)}
          </span>
        </div>

        {/* Title + description */}
        <div className="space-y-2">
          <h4 className="font-heading font-semibold text-lg text-neutral-900">
            {lead.serviceCategory}
          </h4>
          {lead.description && (
            <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">
              {lead.description}
            </p>
          )}
        </div>

        {/* Budget + location */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-neutral-50">
          <div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Budget</p>
            <p className="font-heading font-semibold text-neutral-900">
              {formatBudget(lead.budgetMinPence, lead.budgetMaxPence)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Location</p>
            <p className="font-heading font-semibold text-neutral-900">
              {lead.location || "TBC"}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-error">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            size="sm"
            className="flex-1 py-2.5 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all"
            onClick={handleAccept}
            disabled={accepting || declining}
          >
            <CheckCircle className="mr-1.5 size-4" />
            {accepting ? "Accepting…" : "Accept Lead"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="p-2.5 border border-neutral-200 rounded-xl"
            onClick={() => setShowDeclineDialog(true)}
            disabled={accepting || declining}
            aria-label="Decline lead"
          >
            <XCircle className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
