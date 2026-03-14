"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { AgentOffer, AgentOfferHistory, OfferStatus, AipStatus } from "@/types/agent";
import {
  CheckCircle,
  XCircle,
  ArrowLeftRight,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  Bell,
} from "lucide-react";

// ============================================================================
// Helpers
// ============================================================================

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Status badge configs
// ============================================================================

const STATUS_CONFIG: Record<OfferStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  countered: { label: "Countered", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const AIP_CONFIG: Record<AipStatus, { label: string; className: string }> = {
  not_provided: { label: "No AIP", className: "bg-gray-100 text-gray-600" },
  provided: { label: "AIP Provided", className: "bg-yellow-100 text-yellow-800" },
  verified: { label: "AIP Verified", className: "bg-green-100 text-green-800" },
};

// ============================================================================
// History timeline item
// ============================================================================

type TimelineItemProps = Readonly<{
  entry: AgentOfferHistory;
}>;

function TimelineItem({ entry }: TimelineItemProps) {
  const statusCfg = STATUS_CONFIG[entry.new_status as OfferStatus];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="size-2 rounded-full bg-border mt-1.5 shrink-0" />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {statusCfg && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          )}
          {entry.previous_status && (
            <span className="text-xs text-muted-foreground">
              ← from {STATUS_CONFIG[entry.previous_status as OfferStatus]?.label ?? entry.previous_status}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {formatDateTime(entry.created_at)}
          </span>
        </div>
        {entry.note && (
          <p className="text-sm text-muted-foreground mt-0.5 italic">{entry.note}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          Actor: {entry.actor_id.slice(0, 8)}…
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Counter dialog
// ============================================================================

type CounterDialogProps = Readonly<{
  offerId: string;
  currentAmount: number;
  onClose: () => void;
  onSuccess: (updated: AgentOffer) => void;
}>;

function CounterDialog({ offerId, currentAmount, onClose, onSuccess }: CounterDialogProps) {
  const [counterPounds, setCounterPounds] = useState(
    Math.round(currentAmount / 100).toString(),
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const poundsVal = parseInt(counterPounds, 10);
    if (isNaN(poundsVal) || poundsVal <= 0) {
      setError("Please enter a valid counter amount");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          action: "counter",
          counter_amount: poundsVal * 100,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to submit counter-offer");
      }
      const data = await res.json() as { offer: AgentOffer };
      onSuccess(data.offer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Counter-Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Counter amount (£)</Label>
            <Input
              type="number"
              min={1}
              value={counterPounds}
              onChange={(e) => setCounterPounds(e.target.value)}
              placeholder="Enter amount in pounds"
            />
          </div>
          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for counter-offer..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
            {saving ? "Submitting..." : "Submit counter-offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Reject dialog
// ============================================================================

type RejectDialogProps = Readonly<{
  offerId: string;
  onClose: () => void;
  onSuccess: (updated: AgentOffer) => void;
}>;

function RejectDialog({ offerId, onClose, onSuccess }: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleReject() {
    setSaving(true);
    try {
      const res = await fetch("/api/agent/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          action: "update_status",
          status: "rejected",
          note: reason || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to reject offer");
      }
      const data = await res.json() as { offer: AgentOffer };
      onSuccess(data.offer);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject offer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject this offer?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the offer as rejected and notify the vendor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label>Reason (optional)</Label>
          <Textarea
            className="mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={2}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleReject()}
            disabled={saving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving ? "Rejecting..." : "Reject offer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================================
// NegotiationThread main component
// ============================================================================

type NegotiationThreadProps = Readonly<{
  offer: AgentOffer;
  history: AgentOfferHistory[];
}>;

export function NegotiationThread({ offer: initialOffer, history: initialHistory }: NegotiationThreadProps) {
  const router = useRouter();
  const [offer, setOffer] = useState<AgentOffer>(initialOffer);
  const [history, setHistory] = useState<AgentOfferHistory[]>(initialHistory);
  const [showCounter, setShowCounter] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const statusCfg = STATUS_CONFIG[offer.status];
  const aipCfg = AIP_CONFIG[offer.aip_status];
  const solicitorDetails = offer.solicitor_details as Record<string, string>;

  const isFinal = ["accepted", "rejected", "withdrawn"].includes(offer.status);

  async function handleAccept() {
    try {
      const res = await fetch("/api/agent/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offer.id,
          action: "update_status",
          status: "accepted",
          note: "Offer accepted",
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to accept offer");
      }
      const data = await res.json() as { offer: AgentOffer };
      setOffer(data.offer);
      // Refresh history
      const historyRes = await fetch(`/api/agent/offers/${offer.id}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json() as { history?: AgentOfferHistory[] };
        if (historyData.history) setHistory(historyData.history);
      }
      toast.success("Offer accepted — sale progression initiated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept offer");
    }
  }

  function handleCounterSuccess(updated: AgentOffer) {
    setOffer(updated);
    setShowCounter(false);
    toast.success("Counter-offer submitted");
  }

  function handleRejectSuccess(updated: AgentOffer) {
    setOffer(updated);
    setShowReject(false);
    toast.success("Offer rejected");
  }

  async function handleNotifyVendor() {
    setNotifying(true);
    try {
      const res = await fetch("/api/agent/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offer.id,
          action: "update_status",
          status: offer.status,
          note: "Vendor notified",
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to notify vendor");
      }
      const data = await res.json() as { offer: AgentOffer };
      setOffer(data.offer);
      toast.success("Vendor marked as notified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to notify vendor");
    } finally {
      setNotifying(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        ← Back to offers
      </Button>

      {/* Offer summary card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{offer.buyer_name}</CardTitle>
              <p className="text-3xl font-bold mt-1">{formatGBP(offer.amount)}</p>
              {offer.counter_amount && (
                <p className="text-sm text-orange-600 mt-0.5">
                  Counter-offer on record: {formatGBP(offer.counter_amount)}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${aipCfg.className}`}>
                {aipCfg.label}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buyer details */}
          <div className="grid gap-2 sm:grid-cols-2">
            {offer.buyer_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${offer.buyer_email}`} className="hover:underline">
                  {offer.buyer_email}
                </a>
              </div>
            )}
            {offer.buyer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <a href={`tel:${offer.buyer_phone}`} className="hover:underline">
                  {offer.buyer_phone}
                </a>
              </div>
            )}
          </div>

          {/* Conditions */}
          {offer.conditions && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Conditions
              </p>
              <p className="text-sm border rounded-md p-3 bg-muted/50">{offer.conditions}</p>
            </div>
          )}

          {/* Solicitor details */}
          {Object.keys(solicitorDetails).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <User className="size-3" />
                Solicitor details
              </p>
              <div className="text-sm border rounded-md p-3 bg-muted/50 space-y-1">
                {Object.entries(solicitorDetails).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="size-3" />
              Property: {offer.property_id.slice(0, 8)}…
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              Submitted: {formatDateTime(offer.created_at)}
            </div>
            {offer.vendor_notified && (
              <div className="flex items-center gap-1 text-green-600">
                <Bell className="size-3" />
                Vendor notified
              </div>
            )}
          </div>

          {/* Notify vendor button */}
          {!offer.vendor_notified && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleNotifyVendor()}
              disabled={notifying}
            >
              <Bell className="mr-2 size-4" />
              {notifying ? "Notifying..." : "Mark vendor as notified"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Negotiation history timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offer history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history entries yet.</p>
          ) : (
            <div>
              {history.map((entry) => (
                <TimelineItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {!isFinal && (
        <div className="flex items-center gap-3">
          {offer.status === "pending" && (
            <>
              <Button
                onClick={() => void handleAccept()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="mr-2 size-4" />
                Accept offer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCounter(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <ArrowLeftRight className="mr-2 size-4" />
                Counter
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReject(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-2 size-4" />
                Reject
              </Button>
            </>
          )}

          {offer.status === "countered" && (
            <>
              <Button
                onClick={() => void handleAccept()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="mr-2 size-4" />
                Accept counter
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReject(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-2 size-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      )}

      {isFinal && (
        <div className={`rounded-md p-4 text-sm font-medium ${statusCfg.className}`}>
          This offer is {statusCfg.label.toLowerCase()}. No further actions are available.
        </div>
      )}

      {/* Dialogs */}
      {showCounter && (
        <CounterDialog
          offerId={offer.id}
          currentAmount={offer.amount}
          onClose={() => setShowCounter(false)}
          onSuccess={handleCounterSuccess}
        />
      )}

      {showReject && (
        <RejectDialog
          offerId={offer.id}
          onClose={() => setShowReject(false)}
          onSuccess={handleRejectSuccess}
        />
      )}
    </div>
  );
}
