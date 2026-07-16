
import type { ReferralTier } from "@/types/referrals";
import { Award } from "lucide-react";

type Props = Readonly<{
  currentTier: ReferralTier;
  successfulReferrals: number;
}>;

export function TierProgressBar({ currentTier, successfulReferrals }: Props) {
  const ambassadorUnlocked = successfulReferrals >= 3;
  const progress = Math.min(successfulReferrals, 3);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Ambassador progress</h3>
          <p className="mt-1 text-sm text-neutral-500">Three converted provider referrals unlock directory priority.</p>
        </div>
        {ambassadorUnlocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Award aria-hidden="true" className="size-4" /> Ambassador unlocked
          </span>
        )}
      </div>
      <div
        aria-label={`${progress} of 3 converted referrals`}
        aria-valuemax={3}
        aria-valuemin={0}
        aria-valuenow={progress}
        className="h-3 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-[#1B4D3E]" style={{ width: `${(progress / 3) * 100}%` }} />
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-700">{progress} of 3 converted</p>
      <span className="sr-only">Current referral tier: {currentTier}</span>
    </div>
  );
}
