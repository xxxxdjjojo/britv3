"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";

type Props = Readonly<{
  referralUrl: string;
  referralCode: string;
}>;

export function ReferralSharePanel({ referralUrl, referralCode }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copied!");
      posthog.capture("referral.link_shared", { code: referralCode, channel: "copy" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  }, [referralUrl, referralCode]);

  const shareText = `Join my trusted provider crew on TrueDeed: ${referralUrl}`;
  const whatsappText = encodeURIComponent(shareText);
  const smsText = encodeURIComponent(shareText);

  const emailSubject = encodeURIComponent("Join my TrueDeed provider crew");
  const emailBody = encodeURIComponent(
    `Hi,\n\nI’m building my trusted provider crew on TrueDeed. Join with my referral link:\n${referralUrl}\n\nOnce your first provider subscription invoice is paid, I earn one month of credit.`,
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-bold text-neutral-900">Invite a provider</h2>
      <p className="mb-4 text-sm text-neutral-500">
        You earn one month of subscription credit after their first paid provider invoice.
      </p>

      {/* URL + copy */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          readOnly
          type="text"
          value={referralUrl}
          aria-label="Referral link"
          className="min-h-11 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 focus:outline-none"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy referral link"
          className="min-h-11 shrink-0 rounded-lg bg-[#1B4D3E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2D7A5F]"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Share buttons */}
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "whatsapp" })}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1B4D3E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#153d31]"
        >
          WhatsApp
        </a>
        <a
          href={`sms:?&body=${smsText}`}
          aria-label="Share by SMS"
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "sms" })}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          SMS
        </a>
        <a
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          aria-label="Share by email"
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "email" })}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          Email
        </a>
      </div>
    </div>
  );
}
