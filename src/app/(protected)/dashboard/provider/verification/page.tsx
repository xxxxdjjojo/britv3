import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getVerificationSteps,
  getProviderBadges,
} from "@/services/provider/provider-verification-service";
import { computeTrustScore } from "@/services/provider/trust-score-service";
import { VerificationStepper } from "@/components/dashboard/provider/VerificationStepper";
import { TrustScoreGauge } from "@/components/dashboard/provider/TrustScoreGauge";

export const metadata = {
  title: "Verification & Trust Centre | Provider Dashboard",
};

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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Verification Hub
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Complete each step below to unlock full platform features and build
          customer trust.
        </p>
      </div>

      {/* Two-column layout: stepper (left) + trust score (right) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_288px]">
        {/* Stepper */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-heading text-base font-semibold text-neutral-900">
            Verification Steps
          </h2>
          <VerificationStepper steps={steps} />
        </div>

        {/* Trust score + badge summary */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <TrustScoreGauge score={trustScore} />
          </div>

          {/* Badge count summary */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-lighter text-brand-primary">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">Active Badges</p>
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
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">
            Your Badges
          </h2>
          <ul className="flex flex-wrap gap-3" role="list" aria-label="Earned badges">
            {badges.map((badge) => (
              <li
                key={badge.id}
                className="flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary-lighter px-4 py-2"
              >
                <Award className="size-4 text-brand-primary" aria-hidden="true" />
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
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
          <Award className="mx-auto mb-4 size-9 text-neutral-300" aria-hidden="true" />
          <p className="font-heading text-sm font-semibold text-neutral-600">
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
