import { redirect } from "next/navigation";
import { Award, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getVerificationSteps,
  getProviderBadges,
} from "@/services/provider/provider-verification-service";
import { VerificationStepper } from "@/components/dashboard/provider/VerificationStepper";
import { TrustScoreGauge } from "@/components/dashboard/provider/TrustScoreGauge";

export const metadata = {
  title: "Verification & Trust Centre | Provider Dashboard",
};

/** Derive a 0–100 trust score from the 5 verification steps. */
function computeTrustScore(
  steps: Awaited<ReturnType<typeof getVerificationSteps>>,
): number {
  // Required steps worth 25 pts each, optional steps worth 10 pts each
  const weights: Record<string, number> = {
    id_check: 25,
    insurance: 25,
    qualifications: 20,
    client_references: 15,
    peer_references: 15,
  };

  let earned = 0;
  for (const step of steps) {
    if (step.status === "approved") {
      earned += weights[step.stepId] ?? 10;
    } else if (step.status === "submitted") {
      // Partial credit while under review
      earned += Math.floor((weights[step.stepId] ?? 10) * 0.5);
    }
  }
  return Math.min(100, earned);
}

/** Derive a tier label from the trust score. */
function computeTierLabel(score: number): string {
  if (score >= 90) return "Gold";
  if (score >= 65) return "Silver";
  if (score >= 40) return "Bronze";
  return "Starter";
}

export default async function VerificationOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  const [steps, badges] = await Promise.all([
    getVerificationSteps(providerId, supabase),
    getProviderBadges(supabase, providerId).catch(() => []),
  ]);

  const trustScore = computeTrustScore(steps);
  const tierLabel = computeTierLabel(trustScore);
  const approvedCount = steps.filter((s) => s.status === "approved").length;
  const totalSteps = steps.length;
  const progressPct = totalSteps > 0 ? Math.round((approvedCount / totalSteps) * 100) : 0;
  const nextTierThreshold =
    tierLabel === "Starter" ? 40 : tierLabel === "Bronze" ? 65 : tierLabel === "Silver" ? 90 : 100;
  const nextTierLabel =
    tierLabel === "Starter" ? "Bronze" : tierLabel === "Bronze" ? "Silver" : tierLabel === "Silver" ? "Gold" : "Gold";

  return (
    <div className="space-y-8 p-6 max-w-5xl">
      {/* Page heading */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Compliance Hub
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
          Verification &amp; Trust Centre
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Complete each step below to unlock full platform features and build
          customer trust.
        </p>
      </div>

      {/* Tier status hero banner */}
      <div className="rounded-xl bg-brand-primary-dark p-6 text-white shadow-md">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: tier + progress */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brand-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-gold-foreground">
                Current Status
              </span>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold tracking-tight">
                {tierLabel} Tier
              </p>
              <p className="mt-1 text-sm text-white/70">
                You are {nextTierThreshold - trustScore > 0 ? `${nextTierThreshold - trustScore}%` : "already at"} of the way to {nextTierLabel} Status.
              </p>
            </div>
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-brand-gold transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-white/60">
                Progress to {nextTierLabel}
              </p>
            </div>
          </div>

          {/* Right: stats + CTA */}
          <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-4">
            <div className="flex gap-6">
              {/* Trust score stat */}
              <div className="text-right">
                <p className="font-heading text-3xl font-bold leading-none text-white">
                  {trustScore}
                  <span className="ml-0.5 text-sm font-semibold text-white/60">/100</span>
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
                  Trust Score
                </p>
              </div>
              {/* Active badges stat */}
              <div className="text-right">
                <p className="font-heading text-3xl font-bold leading-none text-white">
                  {badges.length}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
                  Active Badges
                </p>
              </div>
            </div>

            {/* Generate report CTA */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-bold text-brand-gold-foreground transition-opacity hover:opacity-90"
            >
              <TrendingUp className="size-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Verification Actions heading */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
          Verification Actions
        </h2>
        <p className="text-xs text-neutral-400">
          Last updated: Today
        </p>
      </div>

      {/* Verification steps grid + trust gauge sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Steps grid */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <VerificationStepper steps={steps} />
        </div>

        {/* Trust score gauge */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <TrustScoreGauge score={trustScore} />
        </div>
      </div>

      {/* What's Next? */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-heading text-lg font-bold tracking-tight text-neutral-900">
          What&apos;s Next?
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Your roadmap to reaching {nextTierLabel} Status by completing all {totalSteps} steps.
        </p>
        <ul className="space-y-3">
          {steps.map((step) => {
            const isDone = step.status === "approved";
            return (
              <li key={step.stepId} className="flex items-start gap-3">
                <div
                  className={[
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    isDone
                      ? "border-success bg-success"
                      : "border-neutral-300 bg-white",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isDone && (
                    <svg
                      className="size-3 text-white"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p
                    className={[
                      "text-sm font-semibold",
                      isDone ? "text-neutral-400 line-through" : "text-neutral-900",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>
                  {!isDone && (
                    <p className="text-xs text-neutral-500">{step.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Badge gallery / empty state */}
      {badges.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-heading text-lg font-bold tracking-tight text-neutral-900">
            Your Badges
          </h2>
          <ul className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <li
                key={badge.id}
                className="flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary-lighter px-4 py-2"
              >
                <Award className="size-4 text-brand-primary" />
                <span className="text-sm font-semibold text-brand-primary">
                  {badge.badge_label}
                </span>
                {badge.expires_at && (
                  <span className="text-xs text-neutral-500">
                    exp.{" "}
                    {new Date(badge.expires_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {badges.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <Award className="mx-auto mb-3 size-8 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">
            No badges earned yet
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Complete your verification steps to start earning trust badges.
          </p>
        </div>
      )}
    </div>
  );
}
