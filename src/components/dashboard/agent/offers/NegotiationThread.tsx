"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Building2, Mail, Phone, User } from "lucide-react";
import type { AgentOffer, AgentOfferHistory } from "@/types/agent";

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── History timeline ──────────────────────────────────────────────────────────

function HistoryItem({
  item,
}: Readonly<{ item: AgentOfferHistory }>) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="size-2.5 rounded-full bg-primary mt-1 shrink-0" />
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {item.previous_status && (
            <>
              <span className="capitalize text-muted-foreground">
                {item.previous_status}
              </span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </>
          )}
          <span className="capitalize font-medium">{item.new_status}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(item.created_at).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}
          {item.actor_id.slice(0, 8)}…
        </p>
        {item.note && (
          <p className="mt-1 text-sm text-neutral-700">{item.note}</p>
        )}
      </div>
    </div>
  );
}

// ── Counter dialog ────────────────────────────────────────────────────────────

function CounterDialog({
  offerId,
  onDone,
}: Readonly<{ offerId: string; onDone: () => void }>) {
  const [open, setOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(counterAmount, 10);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid counter amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offerId,
          action: "counter",
          counter_amount: amount,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to submit counter");
      }

      toast.success("Counter-offer submitted");
      setOpen(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit counter");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          Counter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Counter-Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="counter_amount">Counter amount (GBP)</Label>
            <Input
              id="counter_amount"
              type="number"
              min={1}
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="e.g. 450000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="counter_note">Note (optional)</Label>
            <Textarea
              id="counter_note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note for the buyer…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Counter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Action helpers ────────────────────────────────────────────────────────────

async function sendAction(
  offerId: string,
  action: "accept" | "reject",
  note?: string,
): Promise<void> {
  const res = await fetch("/api/agent/offers", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: offerId, action, note }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Failed to ${action} offer`);
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function NegotiationThread({
  offer,
  history,
}: Readonly<{ offer: AgentOffer; history: AgentOfferHistory[] }>) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  async function handleAction(action: "accept" | "reject") {
    setActing(action);
    try {
      await sendAction(offer.id, action);
      toast.success(
        action === "accept" ? "Offer accepted" : "Offer rejected",
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActing(null);
    }
  }

  const isFinal =
    offer.status === "accepted" ||
    offer.status === "rejected" ||
    offer.status === "withdrawn";

  return (
    <div className="space-y-6">
      {/* Top card: offer details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="font-medium">{offer.buyer_name}</span>
            </div>
            {offer.buyer_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <span>{offer.buyer_email}</span>
              </div>
            )}
            {offer.buyer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <span>{offer.buyer_phone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="text-sm truncate">{offer.property_id.slice(0, 8)}…</span>
            </div>
            <p className="text-2xl font-bold">{formatGBP(offer.amount)}</p>
            {offer.counter_amount && (
              <p className="text-sm text-muted-foreground">
                Counter: {formatGBP(offer.counter_amount)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                offer.status === "pending"
                  ? "bg-blue-100 text-blue-700"
                  : offer.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : offer.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : offer.status === "countered"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {offer.status}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                offer.aip_status === "verified"
                  ? "bg-green-100 text-green-700"
                  : offer.aip_status === "provided"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {offer.aip_status === "verified"
                ? "AIP Verified"
                : offer.aip_status === "provided"
                  ? "AIP Provided"
                  : "No AIP"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                offer.vendor_notified
                  ? "bg-green-50 text-green-600"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {offer.vendor_notified ? "Vendor notified" : "Vendor not notified"}
            </span>
          </div>

          {offer.conditions && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Conditions</p>
              <p className="text-sm">{offer.conditions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <div>
              {history.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!isFinal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {(offer.status === "pending" || offer.status === "countered") && (
              <>
                {/* Accept */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      {offer.status === "countered" ? "Accept Counter" : "Accept"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Accept this offer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the offer as accepted and begin sale
                        progression.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAction("accept")}
                        disabled={acting === "accept"}
                      >
                        {acting === "accept" ? "Accepting…" : "Accept Offer"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Reject */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Reject</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject this offer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the offer as rejected. This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleAction("reject")}
                        disabled={acting === "reject"}
                      >
                        {acting === "reject" ? "Rejecting…" : "Reject Offer"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Counter (only on pending) */}
                {offer.status === "pending" && (
                  <CounterDialog
                    offerId={offer.id}
                    onDone={() => router.refresh()}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isFinal && (
        <div className="flex items-center gap-2 rounded-lg border p-4">
          <Badge
            className={`capitalize ${
              offer.status === "accepted"
                ? "bg-green-100 text-green-700"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {offer.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            This offer is finalised — no further actions available.
          </span>
        </div>
      )}
    </div>
  );
}
