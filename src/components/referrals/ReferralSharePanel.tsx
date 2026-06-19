"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { QRCodeSVG } from "qrcode.react";

type Props = Readonly<{
  referralUrl: string;
  referralCode: string;
}>;

export function ReferralSharePanel({ referralUrl, referralCode }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

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

  const whatsappText = encodeURIComponent(
    `Hey, I've been using TrueDeed and it's brilliant for getting quality leads. Join using my link and we both get a month free: ${referralUrl}`,
  );

  const emailSubject = encodeURIComponent("Join TrueDeed — we both get a free month");
  const emailBody = encodeURIComponent(
    `Hi,\n\nI've been using TrueDeed to grow my trade business and it's been great — verified leads, no bidding wars, fixed monthly pricing.\n\nIf you sign up using my referral link, we both get 1 month free:\n${referralUrl}\n\nHope to see you there!`,
  );

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-bold text-neutral-900">Share Your Link</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Every tradesperson you refer earns you BOTH 1 month free.
      </p>

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
          className="shrink-0 rounded-lg bg-[#1B4D3E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2D7A5F]"
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
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "whatsapp" })}
          className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
        >
          WhatsApp
        </a>
        <a
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "email" })}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          Email
        </a>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "linkedin" })}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          LinkedIn
        </a>
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          {showQr ? "Hide QR" : "QR Code"}
        </button>
      </div>

      {/* QR Code (toggle) */}
      {showQr && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-6">
          <QRCodeSVG
            value={referralUrl}
            size={200}
            level="M"
            className="rounded-lg"
          />
          <p className="text-xs text-neutral-500">
            Scan or screenshot to share on-site
          </p>
        </div>
      )}
    </div>
  );
}
