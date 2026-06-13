"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { SellerViewing } from "@/types/seller";

type Action = "confirm" | "cancel" | "reschedule";

type Props = Readonly<{
  viewing: SellerViewing;
  action: Action;
  onClose: () => void;
  onSuccess: () => void;
}>;

const ACTION_CONFIG: Record<Action, { title: string; description: string; confirmLabel: string; confirmClass: string }> = {
  confirm: { title: "Confirm Viewing", description: "Confirm this viewing appointment. The buyer will be notified.", confirmLabel: "Confirm Viewing", confirmClass: "bg-brand-primary text-white hover:bg-brand-primary-light" },
  cancel: { title: "Cancel Viewing", description: "Cancel this viewing. Please provide a reason so the buyer can be informed.", confirmLabel: "Cancel Viewing", confirmClass: "bg-red-500 text-white hover:bg-red-600" },
  reschedule: { title: "Reschedule Viewing", description: "Choose a new date and time for this viewing.", confirmLabel: "Reschedule", confirmClass: "bg-brand-primary text-white hover:bg-brand-primary-light" },
};

export function ViewingActionModal({ viewing, action, onClose, onSuccess }: Props) {
  const config = ACTION_CONFIG[action];
  const [notes, setNotes] = useState("");
  const [newDatetime, setNewDatetime] = useState("");
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
    if (action === "reschedule" && !newDatetime) {
      setError("Please select a new date and time.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, string> = { action, notes };
      if (action === "reschedule") body.new_datetime = new Date(newDatetime).toISOString();

      const res = await fetch(`/api/seller/viewings/${viewing.id}`, {
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
      <div role="dialog" aria-modal="true" aria-labelledby="viewing-action-title" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 id="viewing-action-title" className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">{config.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{config.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="p-2 rounded-lg text-slate-400 hover:bg-surface hover:text-slate-600 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="bg-surface rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-slate-700">{viewing.buyer_name}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(viewing.viewing_datetime).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {action === "reschedule" && (
          <div className="mb-4">
            <label className="text-sm font-semibold text-slate-700 block mb-2">New Date & Time</label>
            <input
              type="datetime-local"
              value={newDatetime}
              onChange={(e) => setNewDatetime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        )}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            {action === "cancel" ? "Reason for cancellation" : "Notes (optional)"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={action === "cancel" ? "Let the buyer know why..." : "Any additional notes..."}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-surface transition-colors">
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${config.confirmClass} disabled:opacity-50`}
          >
            {submitting ? "Saving..." : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
