"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentOffer, AgentOfferHistory, OfferStatus } from "@/types/agent";

const STATUS_STYLES: Record<OfferStatus, string> = {
  pending: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  countered: "bg-orange-100 text-orange-700",
  withdrawn: "bg-gray-100 text-gray-600",
};

const AIP_LABELS: Record<string, string> = {
  not_provided: "AIP: Not Provided",
  provided: "AIP: Provided",
  verified: "AIP: Verified",
};

function formatGBP(amountPence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

export function NegotiationThread(
  props: Readonly<{
    offer: AgentOffer;
    history: AgentOfferHistory[];
  }>,
) {
  const router = useRouter();
  const [offer, setOffer] = useState<AgentOffer>(props.offer);
  const [history, setHistory] = useState<AgentOfferHistory[]>(props.history);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Counter form state
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");

  // Reject form state
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isPending = offer.status === "pending";
  const isFinal = ["accepted", "rejected", "withdrawn"].includes(offer.status);

  async function handleStatusUpdate(
    action: "update_status" | "counter",
    status?: OfferStatus,
    extra?: { counter_amount?: number; note?: string },
  ) {
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        id: offer.id,
        action,
      };
      if (status) body.status = status;
      if (extra?.counter_amount) body.counter_amount = extra.counter_amount;
      if (extra?.note) body.note = extra.note;

      const res = await fetch("/api/agent/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update offer");
      }

      const { offer: updated } = (await res.json()) as { offer: AgentOffer };
      setOffer(updated);

      // Add a local history entry
      const newEntry: AgentOfferHistory = {
        id: crypto.randomUUID(),
        offer_id: offer.id,
        previous_status: offer.status,
        new_status: updated.status,
        actor_id: "",
        note: extra?.note ?? `Status changed to ${updated.status}`,
        created_at: new Date().toISOString(),
      };
      setHistory((prev) => [...prev, newEntry]);

      setShowCounter(false);
      setShowReject(false);
      setCounterAmount("");
      setCounterNote("");
      setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    handleStatusUpdate("update_status", "accepted", {
      note: "Offer accepted",
    });
  }

  function handleRejectSubmit() {
    handleStatusUpdate("update_status", "rejected", {
      note: rejectReason || "Offer rejected",
    });
  }

  function handleCounterSubmit() {
    const amount = Math.round(parseFloat(counterAmount) * 100);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid counter amount");
      return;
    }
    handleStatusUpdate("counter", undefined, {
      counter_amount: amount,
      note: counterNote || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/agent/offers")}
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Back to Offers
      </button>

      {/* Offer Summary Card */}
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{offer.buyer_name}</h1>
            <p className="text-sm text-gray-500">
              Property: {offer.property_id.slice(0, 8)}...
            </p>
            {offer.buyer_email && (
              <p className="text-xs text-gray-500">{offer.buyer_email}</p>
            )}
            {offer.buyer_phone && (
              <p className="text-xs text-gray-500">{offer.buyer_phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatGBP(offer.amount)}</p>
            {offer.counter_amount && (
              <p className="text-sm text-orange-600">
                Counter: {formatGBP(offer.counter_amount)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_STYLES[offer.status],
            ].join(" ")}
          >
            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {AIP_LABELS[offer.aip_status] ?? offer.aip_status}
          </span>
          {offer.vendor_notified && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Vendor Notified
            </span>
          )}
        </div>

        {offer.conditions && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Conditions
            </p>
            <p className="text-sm">{offer.conditions}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold">Offer History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No history entries yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 dark:border-gray-700">
            {history.map((entry) => (
              <li key={entry.id} className="mb-4 ml-4">
                <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-white bg-gray-300 dark:border-gray-900 dark:bg-gray-600" />
                <time className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleString("en-GB")}
                </time>
                <div className="mt-0.5 flex items-center gap-2">
                  {entry.previous_status && (
                    <>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {entry.previous_status}
                      </span>
                      <span className="text-xs text-gray-400">&rarr;</span>
                    </>
                  )}
                  <span
                    className={[
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      STATUS_STYLES[entry.new_status as OfferStatus] ??
                        "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {entry.new_status}
                  </span>
                </div>
                {entry.note && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {entry.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Actions */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {isPending && (
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleAccept}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowReject(!showReject);
                setShowCounter(false);
              }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowCounter(!showCounter);
                setShowReject(false);
              }}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              Counter
            </button>
          </div>

          {/* Counter form */}
          {showCounter && (
            <div className="mt-4 space-y-3 rounded border p-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Counter Amount (GBP, e.g. 350000.00)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Note (optional)
                </span>
                <input
                  type="text"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={handleCounterSubmit}
                className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Counter Offer"}
              </button>
            </div>
          )}

          {/* Reject form */}
          {showReject && (
            <div className="mt-4 space-y-3 rounded border p-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Reason (optional)
                </span>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={handleRejectSubmit}
                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          )}
        </div>
      )}

      {offer.status === "countered" && !isFinal && (
        <div className="rounded-lg border bg-amber-50 p-4 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Awaiting response to counter offer of{" "}
            {offer.counter_amount ? formatGBP(offer.counter_amount) : "N/A"}.
          </p>
        </div>
      )}

      {isFinal && (
        <div
          className={[
            "rounded-lg border p-4",
            offer.status === "accepted"
              ? "bg-green-50 dark:bg-green-950"
              : "bg-gray-50 dark:bg-gray-800",
          ].join(" ")}
        >
          <p
            className={[
              "text-sm font-medium",
              offer.status === "accepted"
                ? "text-green-700 dark:text-green-300"
                : "text-gray-600 dark:text-gray-400",
            ].join(" ")}
          >
            This offer has been{" "}
            <strong>{offer.status}</strong>. No further actions available.
          </p>
        </div>
      )}
    </div>
  );
}
