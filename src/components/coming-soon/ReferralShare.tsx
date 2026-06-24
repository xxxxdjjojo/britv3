"use client";

import { useState } from "react";
import { appBaseUrl } from "@/config/brand";

type ReferralShareProps = Readonly<{
  code: string;
  baseUrl?: string;
}>;

const COPIED_RESET_MS = 2000;

export function ReferralShare({ code, baseUrl }: ReferralShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${baseUrl ?? appBaseUrl()}/coming-soon?ref=${code}`;

  async function handleCopy() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "TrueDeed early access",
          text: "Skip the queue for TrueDeed early access.",
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // User dismissed the share sheet, or clipboard was blocked — no-op.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-white/70">
        Share your link — each friend moves you up the queue.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="referral-share-url" className="sr-only">
          Your referral link
        </label>
        <input
          id="referral-share-url"
          type="text"
          readOnly
          value={shareUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="h-12 flex-1 truncate rounded-full border border-white/15 bg-white/10 px-5 text-sm text-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#FDCD74] focus:ring-offset-2 focus:ring-offset-[#04130C]"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#FDCD74] px-6 text-sm font-semibold text-[#04130C] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(253,205,116,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDCD74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04130C]"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
