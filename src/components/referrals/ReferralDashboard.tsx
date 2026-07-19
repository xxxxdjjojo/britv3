"use client";

import { useState, useCallback } from "react";
import type { ReferralStats } from "@/types/referrals";
import { TierProgressBar } from "./TierProgressBar";
import { ReferralSharePanel } from "./ReferralSharePanel";
import { ReferralActivityFeed } from "./ReferralActivityFeed";
import { TierCelebration } from "./TierCelebration";

type Props = Readonly<{
  stats: ReferralStats;
  showCelebration?: boolean;
  celebrationTier?: string;
  providerOnly?: boolean;
}>;

export function ReferralDashboard({ stats, showCelebration, celebrationTier, providerOnly = false }: Props) {
  const [celebrating, setCelebrating] = useState(showCelebration ?? false);
  const [currentStats, setCurrentStats] = useState(stats);
  const [, setLoadingAll] = useState(false);

  const handleShowAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const params = new URLSearchParams({ all: "true" });
      if (providerOnly) params.set("provider", "true");
      const res = await fetch(`/api/referrals/v2?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentStats(data);
      }
    } finally {
      setLoadingAll(false);
    }
  }, [providerOnly]);

  return (
    <div className="space-y-6">
      <TierCelebration
        show={celebrating}
        tierName={celebrationTier ?? ""}
        onComplete={() => setCelebrating(false)}
      />

      <section aria-labelledby="bring-your-crew-heading" className="space-y-4">
        <div>
          <h2 id="bring-your-crew-heading" className="text-2xl font-bold text-neutral-900">
            Bring Your Crew
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Invite trusted providers. You earn one month of subscription credit after each first paid invoice.
          </p>
        </div>

        <TierProgressBar
        currentTier={currentStats.tier}
        successfulReferrals={currentStats.successful_referrals}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-neutral-900">
              {currentStats.credited_months} months credited
            </p>
            <p className="mt-1 text-sm text-neutral-500">Applied to your provider subscription</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-neutral-900">
              {currentStats.credit_cap_used} / {currentStats.credit_cap_limit}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {currentStats.credit_cap_used} of {currentStats.credit_cap_limit} credits used in the last 12 months
            </p>
          </div>
        </div>
      </section>

      <ReferralSharePanel
        referralUrl={currentStats.referral_url}
        referralCode={currentStats.referral_code}
      />

      <ReferralActivityFeed
        referrals={currentStats.referrals}
        totalRewardsPence={currentStats.total_rewards_pence}
        hasMore={currentStats.referrals.length >= 20}
        onShowAll={handleShowAll}
      />
    </div>
  );
}
