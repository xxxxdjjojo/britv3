"use client";

import type { ReferralTier } from "@/types/referrals";
import { TIER_CONFIGS, BADGE_COLORS, getNextTier } from "@/lib/referral-tiers";

type Props = Readonly<{
  currentTier: ReferralTier;
  successfulReferrals: number;
}>;

const DISPLAY_TIERS = ["connector", "ambassador", "champion", "partner"] as const;

export function TierProgressBar({ currentTier, successfulReferrals }: Props) {
  const next = getNextTier(currentTier);
  const remaining = next ? next.threshold - successfulReferrals : 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">Referral Tier</h2>
        {currentTier !== "none" && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              BADGE_COLORS[TIER_CONFIGS[currentTier as Exclude<ReferralTier, "none">].badge].bg
            } ${BADGE_COLORS[TIER_CONFIGS[currentTier as Exclude<ReferralTier, "none">].badge].text}`}
          >
            {TIER_CONFIGS[currentTier as Exclude<ReferralTier, "none">].displayName}
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {DISPLAY_TIERS.map((tier, idx) => {
          const config = TIER_CONFIGS[tier];
          const isReached = successfulReferrals >= config.threshold;
          const isCurrent = currentTier === tier;

          return (
            <div key={tier} className="flex items-center">
              {idx > 0 && (
                <div
                  className={`h-0.5 w-8 sm:w-16 ${
                    isReached ? "bg-[#1B4D3E]" : "bg-neutral-200"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                    isReached
                      ? "bg-[#1B4D3E] text-white"
                      : isCurrent
                        ? "border-2 border-[#1B4D3E] text-[#1B4D3E]"
                        : "border-2 border-neutral-200 text-neutral-400"
                  }`}
                >
                  {config.threshold}
                </div>
                <span className="text-[10px] text-neutral-500">
                  {config.displayName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next tier message */}
      {next && (
        <p className="mt-4 text-sm text-neutral-600">
          <span className="font-semibold">{remaining}</span> more referral{remaining !== 1 ? "s" : ""} to reach{" "}
          <span className="font-semibold">{TIER_CONFIGS[next.tier].displayName}</span>!
        </p>
      )}
      {!next && currentTier === "partner" && (
        <p className="mt-4 text-sm font-medium text-[#1B4D3E]">
          You&apos;ve reached the highest tier. Thank you for building the Britestate community!
        </p>
      )}
    </div>
  );
}
