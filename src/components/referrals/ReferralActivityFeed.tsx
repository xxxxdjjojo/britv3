"use client";

import type { Referral, ReferralStatus } from "@/types/referrals";

type Props = Readonly<{
  referrals: readonly Referral[];
  totalRewardsPence: number;
  hasMore?: boolean;
  onShowAll?: () => void;
}>;

const STATUS_CONFIG: Record<ReferralStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[--color-surface-container-low] text-[--color-on-surface-variant]" },
  rewarded: { label: "Rewarded", className: "bg-brand-primary-lighter text-brand-primary" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReferralActivityFeed({ referrals, totalRewardsPence, hasMore, onShowAll }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[--color-outline-variant] bg-surface-container-lowest p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-on-surface">{referrals.length}</p>
          <p className="mt-1 text-sm text-[--color-on-surface-variant]">Total Referrals</p>
        </div>
        <div className="rounded-xl border border-[--color-outline-variant] bg-surface-container-lowest p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-on-surface">
            {referrals.filter((r) => r.status === "rewarded").length}
          </p>
          <p className="mt-1 text-sm text-[--color-on-surface-variant]">Successful</p>
        </div>
        <div className="rounded-xl border border-[--color-outline-variant] bg-surface-container-lowest p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-brand-primary">
            £{Math.floor(totalRewardsPence / 100)}
          </p>
          <p className="mt-1 text-sm text-[--color-on-surface-variant]">Total Earned</p>
        </div>
      </div>

      {/* Activity table */}
      <div className="rounded-xl border border-[--color-outline-variant] bg-surface-container-lowest shadow-sm">
        <h2 className="border-b border-[--color-outline-variant] px-6 py-4 text-lg font-semibold text-on-surface">
          Referral Activity
        </h2>
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[--color-on-surface-variant]">
              No referrals yet. Share your link to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[--color-outline-variant] bg-[--color-surface-container-low]">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-outline-variant]">
                {referrals.map((referral) => {
                  const config = STATUS_CONFIG[referral.status];
                  return (
                    <tr key={referral.id} className="transition-colors hover:bg-[--color-surface-container-low]">
                      <td className="px-6 py-4 text-on-surface">
                        {referral.referred_name ?? "Tradesperson"}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-[--color-on-surface-variant]">
                        {formatDate(referral.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
                        >
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Show all button when truncated */}
        {hasMore && onShowAll && (
          <div className="border-t border-[--color-outline-variant] px-6 py-3 text-center">
            <button
              type="button"
              onClick={onShowAll}
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              Show all referrals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
