import { REWARD_TIERS } from "@/lib/coming-soon/config";

type ProgressBarProps = Readonly<{
  referralCount: number;
}>;

/** The reward thresholds, ascending — drives the milestone markers. */
const TIER_THRESHOLDS = REWARD_TIERS.map((tier) => tier.referrals);
const MAX_THRESHOLD = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1] ?? 1;

/** The next tier the saver has not yet reached (null once all are cleared). */
function nextTier(referralCount: number) {
  return REWARD_TIERS.find((tier) => referralCount < tier.referrals) ?? null;
}

export function ProgressBar({ referralCount }: ProgressBarProps) {
  const next = nextTier(referralCount);
  const fillPct = Math.min(100, (referralCount / MAX_THRESHOLD) * 100);

  const caption = next
    ? `${referralCount} of ${next.referrals} referrals until ${next.label}`
    : `${referralCount} referrals — every reward unlocked`;

  return (
    <div
      className="w-full"
      role="img"
      aria-label={caption}
    >
      <div aria-hidden className="relative mb-6 h-1.5 rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#FDCD74] transition-[width] duration-700 ease-out"
          style={{ width: `${fillPct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-0.5">
          {TIER_THRESHOLDS.map((threshold) => {
            const reached = referralCount >= threshold;
            return (
              <span
                key={threshold}
                className={`h-3 w-3 rounded-full border-2 border-[#1B4D3E] ${
                  reached ? "bg-[#FDCD74]" : "bg-white/25"
                }`}
              />
            );
          })}
        </div>
      </div>
      <p className="text-[0.7rem] font-medium uppercase tracking-widest text-[#FDCD74]">
        {caption}
      </p>
    </div>
  );
}
