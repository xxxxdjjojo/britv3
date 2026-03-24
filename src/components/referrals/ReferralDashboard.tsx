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
}>;

export function ReferralDashboard({ stats, showCelebration, celebrationTier }: Props) {
  const [celebrating, setCelebrating] = useState(showCelebration ?? false);
  const [currentStats, setCurrentStats] = useState(stats);
  const [, setLoadingAll] = useState(false);

  const handleShowAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/referrals/v2?all=true");
      if (res.ok) {
        const data = await res.json();
        setCurrentStats(data);
      }
    } finally {
      setLoadingAll(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <TierCelebration
        show={celebrating}
        tierName={celebrationTier ?? ""}
        onComplete={() => setCelebrating(false)}
      />

      <TierProgressBar
        currentTier={currentStats.tier}
        successfulReferrals={currentStats.successful_referrals}
      />

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
