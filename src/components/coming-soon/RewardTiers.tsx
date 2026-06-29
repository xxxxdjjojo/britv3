import { REWARD_TIERS } from "@/lib/coming-soon/config";

type RewardTiersProps = Readonly<{
  /** Referral count so far — highlights the next tier still in reach. */
  referralCount?: number;
}>;

export function RewardTiers({ referralCount = 0 }: RewardTiersProps) {
  const nextTier =
    REWARD_TIERS.find((tier) => referralCount < tier.referrals) ?? null;

  return (
    <ul className="flex flex-col">
      {REWARD_TIERS.map((tier, index) => {
        const isReached = referralCount >= tier.referrals;
        const isNext = nextTier?.referrals === tier.referrals;
        const isLast = index === REWARD_TIERS.length - 1;
        const isActive = isReached || isNext;
        const markerClass = isActive
          ? "bg-[#FDCD74] text-[#5D4200] shadow-[0_8px_20px_rgba(253,205,116,0.4)]"
          : "border-2 border-[#1B4D3E]/25 text-[#1B4D3E]/45";

        return (
          <li
            key={tier.referrals}
            className={`group flex items-start gap-4 ${isActive ? "" : "opacity-55"}`}
          >
            <div className="flex flex-col items-center self-stretch">
              <span
                aria-hidden
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${markerClass}`}
              >
                {tier.referrals}
              </span>
              {!isLast && (
                <span
                  aria-hidden
                  className="my-1 w-0.5 flex-1 bg-[#1B4D3E]/15"
                />
              )}
            </div>
            <div className={isLast ? "" : "pb-8"}>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#1B4D3E] transition-colors group-hover:text-[#A07D2E]">
                  {tier.label}
                </h4>
                {isNext && (
                  <span className="rounded-full bg-[#FDCD74] px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-[#5D4200]">
                    Current Goal
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#1B4D3E]/60">
                {tier.description}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
