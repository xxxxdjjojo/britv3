"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics/track-event";

const SHARED = [
  "Your property address",
  "Your indicative estimate and the details you gave",
  "Your email address",
];
const TIMELINES = ["Not sure yet", "0–3 months", "3–6 months", "6–12 months", "12+ months"] as const;
const selectClass =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-base md:text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

export function AgentLeadForm({ valuationId }: { valuationId: string }) {
  const [preference, setPreference] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [timeline, setTimeline] = useState<string>("Not sure yet");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/valuations/${valuationId}/agent-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactPreference: preference,
          phone: preference === "phone" ? phone : null,
          sellingTimeline: timeline,
          consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not submit your request.");
        return;
      }
      trackEvent("agent_lead_submitted", { contact_preference: preference });
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-brand-primary/20 bg-brand-primary-lighter/50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-12 text-brand-primary" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-neutral-900">Request sent</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
          We&apos;ve shared your request with a local expert. They typically respond within 1–2
          working days by your chosen contact method.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <ShieldCheck className="size-4 text-brand-primary" aria-hidden="true" />
          What we&apos;ll share with the agent
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
          {SHARED.map((s) => <li key={s}>{s}</li>)}
          {preference === "phone" ? <li>Your phone number</li> : null}
        </ul>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-700">How should they contact you?</legend>
        <div className="flex gap-4">
          {(["email", "phone"] as const).map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
              <input type="radio" name="pref" className="accent-brand-primary" checked={preference === opt} onChange={() => setPreference(opt)} />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>

      {preference === "phone" ? (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" autoComplete="tel" />
          <p className="text-xs text-neutral-500">We only ask for your phone number because you chose phone contact.</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="timeline">When are you thinking of selling? (optional)</Label>
        <select id="timeline" className={selectClass} value={timeline} onChange={(e) => setTimeline(e.target.value)}>
          {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-3 text-sm text-neutral-700">
        <input type="checkbox" className="mt-0.5 size-4 accent-brand-primary" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {/* TODO(legal): counsel review */}
          Yes, share my details with a local estate agent so they can contact me about valuing my
          property. This is separate from my account and any marketing.
        </span>
      </label>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={!consent || submitting} className="w-full">
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Request a local expert valuation
      </Button>
    </form>
  );
}
