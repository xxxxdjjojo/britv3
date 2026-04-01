
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
    <div className="rounded-xl border border-[--color-outline-variant] bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">Referral Tier</h2>
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
                    isReached ? "bg-brand-primary" : "bg-[--color-outline-variant]"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                    isReached
                      ? "bg-brand-primary text-white"
                      : isCurrent
                        ? "border-2 border-brand-primary text-brand-primary"
                        : "border-2 border-[--color-outline-variant] text-[--color-on-surface-variant]"
                  }`}
                >
                  {config.threshold}
                </div>
                <span className="text-[10px] text-[--color-on-surface-variant]">
                  {config.displayName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next tier message */}
      {next && (
        <p className="mt-4 text-sm text-[--color-on-surface-variant]">
          <span className="font-semibold">{remaining}</span> more referral{remaining !== 1 ? "s" : ""} to reach{" "}
          <span className="font-semibold">{TIER_CONFIGS[next.tier].displayName}</span>!
        </p>
      )}
      {!next && currentTier === "partner" && (
        <p className="mt-4 text-sm font-medium text-brand-primary">
          You&apos;ve reached the highest tier. Thank you for building the Britestate community!
        </p>
      )}
    </div>
  );
}
