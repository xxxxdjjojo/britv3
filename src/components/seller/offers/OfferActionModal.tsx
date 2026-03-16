"use client";

import { useState } from "react";
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
        if (!counterAmount) { setError("Please enter a counter offer amount."); setSubmitting(false); return; }
        body.counter_amount = parseInt(counterAmount.replace(/,/g, ""));
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {action === "accept" ? "Accept Offer" : action === "counter" ? "Counter Offer" : "Reject Offer"}
            </h3>
            <p className="text-2xl font-black text-slate-900 mt-1">£{(offer.amount / 100).toLocaleString("en-GB")}</p>
            <p className="text-sm text-slate-500">from {offer.buyer_name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>
        {action === "accept" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Accepting this offer will begin the conveyancing process. Please provide your solicitor details.</p>
            {[
              { label: "Solicitor Name", value: solicitorName, onChange: setSolicitorName, type: "text", placeholder: "Smith & Associates" },
              { label: "Solicitor Email", value: solicitorEmail, onChange: setSolicitorEmail, type: "email", placeholder: "solicitor@firm.co.uk" },
              { label: "Solicitor Phone", value: solicitorPhone, onChange: setSolicitorPhone, type: "tel", placeholder: "020 7946 0958" },
            ].map(({ label, value, onChange, type, placeholder }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-slate-600">{label} <span className="text-slate-400">(optional)</span></label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30" />
              </div>
            ))}
          </div>
        )}
        {action === "counter" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Propose a different amount to the buyer.</p>
            <div>
              <label className="text-xs font-semibold text-slate-600">Counter Amount (£)</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">£</span>
                <input type="text" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="360,000" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Message to buyer <span className="text-slate-400">(optional)</span></label>
              <textarea value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} rows={3} placeholder="Explain your counter offer..." className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30" />
            </div>
          </div>
        )}
        {action === "reject" && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm text-red-700 font-medium">Are you sure you want to reject this offer? This cannot be undone.</p>
          </div>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${action === "reject" ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#1B4D3E] text-white hover:bg-[#2D7A5F]"}`}>
            {submitting ? "Saving..." : action === "accept" ? "Accept Offer" : action === "counter" ? "Send Counter" : "Reject Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
