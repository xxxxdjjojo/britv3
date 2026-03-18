"use client";

import type { Referral, ReferralStatus } from "@/types/referrals";

type Props = Readonly<{
  referrals: readonly Referral[];
  totalRewardsPence: number;
  hasMore?: boolean;
  onShowAll?: () => void;
}>;

const STATUS_CONFIG: Record<ReferralStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-neutral-100 text-neutral-600" },
  rewarded: { label: "Rewarded", className: "bg-green-100 text-green-700" },
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
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-neutral-900">{referrals.length}</p>
          <p className="mt-1 text-sm text-neutral-500">Total Referrals</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-neutral-900">
            {referrals.filter((r) => r.status === "rewarded").length}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Successful</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">
            £{Math.floor(totalRewardsPence / 100)}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Total Earned</p>
        </div>
      </div>

      {/* Activity table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-6 py-4 text-lg font-semibold text-neutral-900">
          Referral Activity
        </h2>
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500">
              No referrals yet. Share your link to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {referrals.map((referral) => {
                  const config = STATUS_CONFIG[referral.status];
                  return (
                    <tr key={referral.id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-6 py-4 text-neutral-700">
                        {referral.referred_name ?? "Tradesperson"}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-neutral-500">
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
          <div className="border-t border-neutral-100 px-6 py-3 text-center">
            <button
              type="button"
              onClick={onShowAll}
              className="text-sm font-medium text-[#1B4D3E] hover:underline"
            >
              Show all referrals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
