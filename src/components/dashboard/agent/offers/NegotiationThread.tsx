"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { ArrowRight, Building2, CheckCircle2, Mail, Phone, User, XCircle } from "lucide-react";
import type { AgentOffer, AgentOfferHistory } from "@/types/agent";

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── History timeline ──────────────────────────────────────────────────────────

function HistoryItem({ item }: Readonly<{ item: AgentOfferHistory }>) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="mt-1 size-2.5 shrink-0 rounded-full bg-brand-primary" />
        <div className="w-px flex-1 bg-neutral-200" />
      </div>
      <div className="pb-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {item.previous_status && (
            <>
              <span className="capitalize text-neutral-400">
                {item.previous_status}
              </span>
              <ArrowRight className="size-3 text-neutral-400" />
            </>
          )}
          <span className="capitalize font-semibold text-neutral-800">
            {item.new_status}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-400">
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
          <p className="mt-1.5 rounded-xl bg-muted/40 px-3 py-2 text-sm text-neutral-700">
            {item.note}
          </p>
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
        <Button className="rounded-xl bg-warning text-white hover:bg-warning/90">
          Counter
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
            Submit Counter-Offer
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="counter_amount" className="text-sm font-medium text-neutral-700">
              Counter amount (GBP)
            </Label>
            <Input
              id="counter_amount"
              type="number"
              min={1}
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="e.g. 450000"
              className="rounded-xl bg-neutral-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="counter_note" className="text-sm font-medium text-neutral-700">
              Note (optional)
            </Label>
            <Textarea
              id="counter_note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note for the buyer…"
              className="resize-none rounded-xl bg-neutral-50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90">
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

// ── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: React.ElementType; label: string; value: string }>) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary-lighter">
        <Icon className="size-4 text-brand-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function offerStatusConfig(status: string): { bg: string; text: string } {
  switch (status) {
    case "pending":
      return { bg: "bg-info-light", text: "text-info" };
    case "accepted":
      return { bg: "bg-success-light", text: "text-success" };
    case "rejected":
      return { bg: "bg-error-light", text: "text-error" };
    case "countered":
      return { bg: "bg-warning-light", text: "text-warning" };
    default:
      return { bg: "bg-neutral-100", text: "text-neutral-500" };
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

  const statusCfg = offerStatusConfig(offer.status);
  const aipBg =
    offer.aip_status === "verified"
      ? "bg-success-light text-success"
      : offer.aip_status === "provided"
        ? "bg-warning-light text-warning"
        : "bg-neutral-100 text-neutral-500";

  return (
    <div className="space-y-5">
      {/* Offer amount hero */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-primary px-6 py-5 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <p className="text-sm font-medium text-white/70">Offer Amount</p>
        <p className="mt-1 font-heading text-4xl font-bold tracking-tight">
          {formatGBP(offer.amount)}
        </p>
        {offer.counter_amount && (
          <p className="mt-2 text-sm text-white/70">
            Counter: {formatGBP(offer.counter_amount)}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusCfg.bg} ${statusCfg.text}`}
          >
            {offer.status}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${aipBg}`}
          >
            {offer.aip_status === "verified"
              ? "AIP Verified"
              : offer.aip_status === "provided"
                ? "AIP Provided"
                : "No AIP"}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              offer.vendor_notified
                ? "bg-success-light text-success"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {offer.vendor_notified ? "Vendor notified" : "Vendor not notified"}
          </span>
        </div>
      </div>

      {/* Buyer details */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
        <div className="bg-muted/30 px-5 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Buyer Details
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <InfoRow icon={User} label="Buyer Name" value={offer.buyer_name} />
          {offer.buyer_email && (
            <InfoRow icon={Mail} label="Email" value={offer.buyer_email} />
          )}
          {offer.buyer_phone && (
            <InfoRow icon={Phone} label="Phone" value={offer.buyer_phone} />
          )}
          <InfoRow
            icon={Building2}
            label="Property"
            value={`${offer.property_id.slice(0, 8)}…`}
          />
        </div>
        {offer.conditions && (
          <div className="px-4 pb-4">
            <div className="mb-3 h-px bg-neutral-100" />
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
              Conditions
            </p>
            <p className="mt-1.5 text-sm text-neutral-700">{offer.conditions}</p>
          </div>
        )}
      </div>

      {/* History timeline */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
        <div className="bg-muted/30 px-5 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            History
          </p>
        </div>
        <div className="p-5">
          {history.length === 0 ? (
            <p className="text-sm text-neutral-400">No history yet.</p>
          ) : (
            <div>
              {history.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isFinal && (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
          <div className="bg-muted/30 px-5 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Actions
            </p>
          </div>
          <div className="flex flex-wrap gap-3 p-4">
            {(offer.status === "pending" || offer.status === "countered") && (
              <>
                {/* Accept */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="rounded-xl bg-success text-white hover:bg-success/90">
                      <CheckCircle2 className="mr-2 size-4" />
                      {offer.status === "countered" ? "Accept Counter" : "Accept"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading text-lg font-semibold tracking-tight">
                        Accept this offer?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-500">
                        This will mark the offer as accepted and begin sale
                        progression.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl bg-success text-white hover:bg-success/90"
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
                    <Button
                      variant="outline"
                      className="rounded-xl text-error hover:bg-error-light hover:text-error"
                    >
                      <XCircle className="mr-2 size-4" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading text-lg font-semibold tracking-tight">
                        Reject this offer?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-500">
                        This will mark the offer as rejected. This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl bg-error text-white hover:bg-error/90"
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
          </div>
        </div>
      )}

      {isFinal && (
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
          <Badge
            className={`capitalize rounded-full ${
              offer.status === "accepted"
                ? "bg-success-light text-success"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {offer.status}
          </Badge>
          <span className="text-sm text-neutral-500">
            This offer is finalised — no further actions available.
          </span>
        </div>
      )}
    </div>
  );
}
