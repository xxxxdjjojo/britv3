"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/track-event";

type Summary = { rows: ReadonlyArray<{ label: string; value: string }> };

export function ReviewStep({ summary }: { summary: Summary }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ownedResultId, setOwnedResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/valuations/calculate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't calculate your estimate.");
        return;
      }
      trackEvent("calculation_completed", {
        evidence_quality: data.evidenceQuality ?? null,
        fallback_level: data.fallbackLevel ?? null,
      });
      setOwnedResultId(data.resultId ?? null);
      setReady(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (ready) {
    return (
      <div className="rounded-xl border border-brand-primary/20 bg-brand-primary-lighter/50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-12 text-brand-primary" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-neutral-900">Your estimate is ready</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
          {ownedResultId
            ? "Your updated estimate has been saved to your account."
            : "Verify your email to view your indicative estimate and save it to a free account. We'll send a one-time code — no password, and no marketing unless you ask for it."}
        </p>
        <Button
          onClick={() =>
            router.push(
              ownedResultId
                ? `/value-my-property/result/${ownedResultId}`
                : "/value-my-property/verify-email",
            )
          }
          className="mt-5"
        >
          <Mail className="mr-2 size-4" aria-hidden="true" />
          {ownedResultId ? "View my estimate" : "Verify email & view estimate"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
        {summary.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3 text-sm">
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="font-medium text-neutral-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/value-my-property/details")}>
          Back
        </Button>
        <Button onClick={calculate} disabled={loading} className="flex-1">
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Get my estimate
        </Button>
      </div>
    </div>
  );
}
