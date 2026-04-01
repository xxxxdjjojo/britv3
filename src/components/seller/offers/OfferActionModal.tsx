"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { SellerOffer } from "@/types/seller";

type Action = "accept" | "counter" | "reject";

type Props = Readonly<{
  offer: SellerOffer;
  action: Action;
  onClose: () => void;
  onSuccess: () => void;
}>;

export function OfferActionModal({ offer, action, onClose, onSuccess }: Props) {
  const [solicitorName, setSolicitorName] = useState(offer.solicitor_name ?? "");
  const [solicitorEmail, setSolicitorEmail] = useState(offer.solicitor_email ?? "");
  const [solicitorPhone, setSolicitorPhone] = useState(offer.solicitor_phone ?? "");
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, string | number> = { action };
      if (action === "accept") {
        body.solicitor_name = solicitorName;
        body.solicitor_email = solicitorEmail;
        body.solicitor_phone = solicitorPhone;
      }
      if (action === "counter") {
        const parsed = parseInt(counterAmount.replace(/,/g, ""));
        if (!counterAmount || isNaN(parsed) || parsed <= 0) {
          setError("Please enter a valid counter offer amount greater than £0.");
          setSubmitting(false);
          return;
        }
        body.counter_amount = parsed;
        body.counter_message = counterMessage;
      }
      const res = await fetch(`/api/seller/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Action failed");
      }
      onSuccess();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="offer-action-title" className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 id="offer-action-title" className="text-lg font-bold text-on-surface font-heading">
              {action === "accept" ? "Accept Offer" : action === "counter" ? "Counter Offer" : "Reject Offer"}
            </h3>
            <p className="text-2xl font-black text-on-surface mt-1">£{(offer.amount / 100).toLocaleString("en-GB")}</p>
            <p className="text-sm text-on-surface-variant">from {offer.buyer_name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="p-2 rounded-lg text-outline hover:bg-surface-container-low">
            <X size={18} />
          </button>
        </div>
        {action === "accept" && (
          <div className="space-y-4">
            {!offer.is_verified && (
              <div className="bg-secondary-container/20 rounded-xl p-4 border border-secondary/30 mb-4">
                <p className="text-sm font-semibold text-secondary">Unverified Buyer</p>
                <p className="text-xs text-secondary/80 mt-1">
                  This buyer has not completed identity or proof of funds verification.
                  Accepting an unverified offer carries higher fall-through risk.
                </p>
              </div>
            )}
            <p className="text-sm text-on-surface-variant">Accepting this offer will begin the conveyancing process. Please provide your solicitor details.</p>
            {[
              { label: "Solicitor Name", value: solicitorName, onChange: setSolicitorName, type: "text", placeholder: "Smith & Associates" },
              { label: "Solicitor Email", value: solicitorEmail, onChange: setSolicitorEmail, type: "email", placeholder: "solicitor@firm.co.uk" },
              { label: "Solicitor Phone", value: solicitorPhone, onChange: setSolicitorPhone, type: "tel", placeholder: "020 7946 0958" },
            ].map(({ label, value, onChange, type, placeholder }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-on-surface-variant">{label} <span className="text-outline">(optional)</span></label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/30" />
              </div>
            ))}
          </div>
        )}
        {action === "counter" && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">Propose a different amount to the buyer.</p>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Counter Amount (£)</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">£</span>
                <input type="text" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="360,000" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-container/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Message to buyer <span className="text-outline">(optional)</span></label>
              <textarea value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} rows={3} placeholder="Explain your counter offer..." className="mt-1 w-full px-4 py-2.5 rounded-xl border border-outline-variant text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-container/30" />
            </div>
          </div>
        )}
        {action === "reject" && (
          <div className="bg-error-container/30 rounded-xl p-4 border border-error/20">
            <p className="text-sm text-error font-medium">Are you sure you want to reject this offer? This cannot be undone.</p>
          </div>
        )}
        {error && <p className="text-error text-sm mt-4">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${action === "reject" ? "bg-error text-white hover:bg-error/90" : "bg-primary text-white hover:bg-primary-container"}`}>
            {submitting ? "Saving..." : action === "accept" ? "Accept Offer" : action === "counter" ? "Send Counter" : "Reject Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
