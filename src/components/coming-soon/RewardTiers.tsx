import { REWARD_TIERS } from "@/lib/coming-soon/config";

type RewardTiersProps = Readonly<{
  /** Referral count so far — highlights the next tier still in reach. */
  referralCount?: number;
}>;

export function RewardTiers({ referralCount = 0 }: RewardTiersProps) {
  const nextTier =
    REWARD_TIERS.find((tier) => referralCount < tier.referrals) ?? null;

  return (
    <ul className="flex flex-col gap-6">
      {REWARD_TIERS.map((tier) => {
        const isReached = referralCount >= tier.referrals;
        const isNext = nextTier?.referrals === tier.referrals;
        const markerClass = isReached || isNext
          ? "bg-[#FDCD74] text-[#7B5804]"
          : "bg-[#1B4D3E]/8 text-[#1B4D3E]/55";

        return (
          <li key={tier.referrals} className="group flex items-start gap-4">
            <span
              aria-hidden
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${markerClass}`}
            >
              {tier.referrals}
            </span>
            <div>
              <h4 className="mb-1 text-sm font-bold text-[#1B4D3E] transition-colors group-hover:text-[#A07D2E]">
                {tier.label}
              </h4>
              <p className="text-xs leading-relaxed text-[#1B4D3E]/60">
                {tier.description}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
