"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  developmentLeadSchema,
  type DevelopmentLeadInput,
} from "@/lib/new-homes/lead-schema";
import type {
  DevelopmentLeadType,
  DevelopmentUnit,
} from "@/lib/new-homes/types";

type FieldState = {
  name: string;
  email: string;
  phone: string;
  buyerStatus: string;
  budget: string;
  desiredMoveDate: string;
  mortgagePosition: string;
  hasPropertyToSell: boolean;
  preferredPlot: string;
  preferredViewingAt: string;
  message: string;
};

const EMPTY: FieldState = {
  name: "",
  email: "",
  phone: "",
  buyerStatus: "",
  budget: "",
  desiredMoveDate: "",
  mortgagePosition: "",
  hasPropertyToSell: false,
  preferredPlot: "",
  preferredViewingAt: "",
  message: "",
};

const inputClass =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-xs font-semibold text-neutral-600";

function readUtm(): DevelopmentLeadInput["utm"] {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const pick = (k: string) => params.get(k) ?? undefined;
  const utm = {
    source: pick("utm_source"),
    medium: pick("utm_medium"),
    campaign: pick("utm_campaign"),
    term: pick("utm_term"),
    content: pick("utm_content"),
  };
  return Object.values(utm).some(Boolean) ? utm : undefined;
}

export function LeadForm({
  developmentId,
  leadType,
  units,
  defaultPlot,
  onSuccess,
}: Readonly<{
  developmentId: string;
  leadType: DevelopmentLeadType;
  units: DevelopmentUnit[];
  defaultPlot?: string;
  onSuccess?: () => void;
}>) {
  const [fields, setFields] = useState<FieldState>(() =>
    defaultPlot ? { ...EMPTY, preferredPlot: defaultPlot } : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const showQualification = leadType === "register_interest";
  const showViewing = leadType === "book_viewing";
  const showMessage = leadType === "ask_question" || leadType === "register_interest";
  const availableUnits = units.filter((u) => u.status === "available");

  const set = (patch: Partial<FieldState>) =>
    setFields((prev) => ({ ...prev, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: DevelopmentLeadInput = {
      developmentId,
      leadType,
      name: fields.name,
      email: fields.email,
      phone: fields.phone || undefined,
      buyerStatus: showQualification
        ? (fields.buyerStatus || undefined) as DevelopmentLeadInput["buyerStatus"]
        : undefined,
      budget: showQualification && fields.budget ? Number(fields.budget) : undefined,
      desiredMoveDate: showQualification ? fields.desiredMoveDate || undefined : undefined,
      mortgagePosition: showQualification
        ? (fields.mortgagePosition || undefined) as DevelopmentLeadInput["mortgagePosition"]
        : undefined,
      hasPropertyToSell: showQualification ? fields.hasPropertyToSell : undefined,
      preferredPlot: fields.preferredPlot || undefined,
      preferredViewingAt: showViewing ? fields.preferredViewingAt || undefined : undefined,
      message: showMessage ? fields.message || undefined : undefined,
      sourceRoute: typeof window !== "undefined" ? window.location.pathname : undefined,
      utm: readUtm(),
    };

    const parsed = developmentLeadSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/new-homes/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      try {
        posthog.capture("new_homes_lead_submitted", {
          lead_type: leadType,
          development_id: developmentId,
        });
      } catch {
        // analytics is best-effort
      }
      setDone(true);
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-6">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-heading text-lg font-semibold text-neutral-900">
          Enquiry sent
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          The developer&apos;s sales team will be in touch shortly. We&apos;ve
          recorded your interest.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="lead-name">Full name *</label>
          <input
            id="lead-name"
            className={inputClass}
            value={fields.name}
            onChange={(e) => set({ name: e.target.value })}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lead-email">Email *</label>
          <input
            id="lead-email"
            type="email"
            className={inputClass}
            value={fields.email}
            onChange={(e) => set({ email: e.target.value })}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lead-phone">Phone</label>
          <input
            id="lead-phone"
            type="tel"
            className={inputClass}
            value={fields.phone}
            onChange={(e) => set({ phone: e.target.value })}
            autoComplete="tel"
          />
        </div>
      </div>

      {showQualification ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="lead-buyer">Buyer status</label>
            <select
              id="lead-buyer"
              className={inputClass}
              value={fields.buyerStatus}
              onChange={(e) => set({ buyerStatus: e.target.value })}
            >
              <option value="">Select…</option>
              <option value="first_time_buyer">First-time buyer</option>
              <option value="home_mover">Home mover</option>
              <option value="investor">Investor</option>
              <option value="relocating">Relocating</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lead-budget">Budget (£)</label>
            <input
              id="lead-budget"
              type="number"
              inputMode="numeric"
              className={inputClass}
              value={fields.budget}
              onChange={(e) => set({ budget: e.target.value })}
              placeholder="e.g. 350000"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lead-move">Desired move date</label>
            <input
              id="lead-move"
              className={inputClass}
              value={fields.desiredMoveDate}
              onChange={(e) => set({ desiredMoveDate: e.target.value })}
              placeholder="e.g. Within 6 months"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lead-mortgage">Mortgage position</label>
            <select
              id="lead-mortgage"
              className={inputClass}
              value={fields.mortgagePosition}
              onChange={(e) => set({ mortgagePosition: e.target.value })}
            >
              <option value="">Select…</option>
              <option value="cash_buyer">Cash buyer</option>
              <option value="agreement_in_principle">Agreement in principle</option>
              <option value="applied">Applied</option>
              <option value="help_to_buy">Using Help to Buy</option>
              <option value="not_started">Not started</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
            <input
              type="checkbox"
              className="size-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
              checked={fields.hasPropertyToSell}
              onChange={(e) => set({ hasPropertyToSell: e.target.checked })}
            />
            I have a property to sell
          </label>
        </div>
      ) : null}

      {showViewing ? (
        <div>
          <label className={labelClass} htmlFor="lead-viewing">Preferred viewing date / time</label>
          <input
            id="lead-viewing"
            className={inputClass}
            value={fields.preferredViewingAt}
            onChange={(e) => set({ preferredViewingAt: e.target.value })}
            placeholder="e.g. Saturday morning, or 2026-07-12"
          />
        </div>
      ) : null}

      {availableUnits.length > 0 ? (
        <div>
          <label className={labelClass} htmlFor="lead-plot">Preferred plot (optional)</label>
          <select
            id="lead-plot"
            className={inputClass}
            value={fields.preferredPlot}
            onChange={(e) => set({ preferredPlot: e.target.value })}
          >
            <option value="">No preference</option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.plotNumber}>
                Plot {u.plotNumber} — {u.unitType}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showMessage ? (
        <div>
          <label className={labelClass} htmlFor="lead-message">
            {leadType === "ask_question" ? "Your question *" : "Anything else?"}
          </label>
          <textarea
            id="lead-message"
            className="min-h-[88px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            value={fields.message}
            onChange={(e) => set({ message: e.target.value })}
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-primary hover:bg-brand-primary-light"
      >
        {submitting ? "Sending…" : "Submit enquiry"}
      </Button>
      <p className="text-center text-[11px] text-neutral-400">
        By submitting you agree to be contacted by the developer about this
        development.
      </p>
    </form>
  );
}
