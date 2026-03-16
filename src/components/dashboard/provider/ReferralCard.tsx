"use client";

import { useState } from "react";
import type { ProviderReferral, ReferralStatus } from "@/types/provider-dashboard";
import type { ReferralStats } from "@/services/provider/provider-referral-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function penceToGbp(pence: number): string {
  return `£${(pence / 100).toFixed(0)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type StatusBadgeProps = Readonly<{ status: ReferralStatus }>;

function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<ReferralStatus, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-neutral-100 text-neutral-600",
    },
    signed_up: {
      label: "Signed Up",
      className: "bg-blue-100 text-blue-700",
    },
    verified: {
      label: "Verified",
      className: "bg-brand-primary/10 text-brand-primary",
    },
    rewarded: {
      label: "Rewarded",
      className: "bg-green-100 text-green-700",
    },
  };

  const { label, className } = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReferralCardProps = Readonly<{
  referralCode: string;
  stats: ReferralStats;
  referrals: ProviderReferral[];
}>;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ReferralCard({ referralCode, stats, referrals }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
  const referralUrl = `${appUrl}/join/provider?ref=${referralCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the input text
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Join me on Britestate — the UK's best platform for tradespeople. Sign up using my referral link and we both benefit: ${referralUrl}`,
  );
  const emailSubject = encodeURIComponent("Join Britestate — earn £50 as a new tradesperson");
  const emailBody = encodeURIComponent(
    `Hi,\n\nI've been using Britestate to manage my trade business and it's been great.\n\nIf you sign up using my referral link, we both earn £50:\n${referralUrl}\n\nHope to see you there!`,
  );

  // Filter out seed rows (no referred_user_id) for the display table
  const actualReferrals = referrals.filter((r) => r.referred_user_id !== null);

  return (
    <div className="space-y-8">
      {/* Referral Link panel */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Refer a tradesperson, earn £50
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Share your unique link. When a tradesperson signs up and gets verified, you
              both earn £50.
            </p>
          </div>
          <div className="shrink-0 text-4xl">🤝</div>
        </div>

        {/* URL + copy */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            readOnly
            type="text"
            value={referralUrl}
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 focus:outline-none"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share via WhatsApp
          </a>
          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            Share via Email
          </a>
        </div>
      </section>

      {/* Stats row */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Your Referral Stats</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-neutral-900">{stats.total}</p>
            <p className="mt-1 text-sm text-neutral-500">Total Invited</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-neutral-900">
              {stats.by_status.signed_up + stats.by_status.verified + stats.by_status.rewarded}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Signed Up</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">
              {penceToGbp(stats.total_rewards_pence)}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Total Earned</p>
          </div>
        </div>
      </section>

      {/* Referred Providers table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Referred Tradespeople</h2>
        {actualReferrals.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">
              No referrals yet. Share your link above to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Date Invited
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {actualReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-700">
                        {referral.referred_user_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatDate(referral.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={referral.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-700">
                        {referral.status === "rewarded" && referral.reward_amount != null
                          ? penceToGbp(referral.reward_amount)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
