import { REWARD_TIERS } from "@/lib/coming-soon/config";

export function RewardTiers() {
  return (
    <ul className="flex flex-col gap-3">
      {REWARD_TIERS.map((tier) => (
        <li
          key={tier.referrals}
          className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors duration-300 hover:border-[#FDCD74]/40 hover:bg-white/[0.07]"
        >
          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#FDCD74]/15 text-[#FDCD74]">
            <span className="text-base font-semibold leading-none tabular-nums">
              {tier.referrals}
            </span>
            <span className="text-[0.55rem] uppercase tracking-wide opacity-70">
              refs
            </span>
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-white">
              {tier.label}
            </span>
            <span className="text-sm leading-relaxed text-white/55">
              {tier.description}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
