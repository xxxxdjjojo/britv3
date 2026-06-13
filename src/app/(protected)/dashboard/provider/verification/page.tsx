import { redirect } from "next/navigation";
import { Award } from "lucide-react";
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

  return (
    <div className="space-y-8 p-6 max-w-5xl">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Verification &amp; Trust Centre
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Complete each step below to unlock full platform features and build
          customer trust.
        </p>
      </div>

      {/* Two-column layout: stepper (left) + trust score (right) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Stepper */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-neutral-900">
            Verification Steps
          </h2>
          <VerificationStepper steps={steps} />
        </div>

        {/* Trust score + badge summary */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <TrustScoreGauge score={trustScore} />
          </div>

          {/* Badge count summary */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#E8F5EE] text-brand-primary">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Active Badges</p>
                <p className="text-2xl font-black text-neutral-900">
                  {badges.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge gallery */}
      {badges.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">
            Your Badges
          </h2>
          <ul className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <li
                key={badge.id}
                className="flex items-center gap-2 rounded-full border border-brand-primary/20 bg-[#E8F5EE] px-4 py-2"
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
        <div className="rounded-xl border border-dashed border-neutral-200 bg-surface p-8 text-center">
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
