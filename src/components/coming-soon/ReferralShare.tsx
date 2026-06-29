"use client";

import { useState } from "react";
import { appBaseUrl } from "@/config/brand";

type ReferralShareProps = Readonly<{
  code: string;
  baseUrl?: string;
}>;

const COPIED_RESET_MS = 2000;
const SHARE_TITLE = "TrueDeed early access";
const SHARE_TEXT = "Skip the queue for TrueDeed early access.";

export function ReferralShare({ code, baseUrl }: ReferralShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${baseUrl ?? appBaseUrl()}/coming-soon?ref=${code}`;

  async function handleCopy() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
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
    <div className="relative z-10 flex flex-col">
      <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-white">
        Ascend to Founder status.
      </h2>
      <p className="mt-3 max-w-md leading-relaxed text-white/70">
        Share your private link — each friend who joins moves you up the queue
        and unlocks tier rewards.
      </p>

      <label
        htmlFor="referral-share-url"
        className="mt-8 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/55"
      >
        Your unique invitation link
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 backdrop-blur-md focus-within:border-[#FDCD74]">
          <span aria-hidden className="text-[#FDCD74]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <input
            id="referral-share-url"
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 w-full truncate bg-transparent text-sm font-medium text-white placeholder-white/40 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#FDCD74] px-7 text-sm font-semibold text-[#5D4200] transition duration-300 ease-out hover:bg-[#eec068] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDCD74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B4D3E]"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <p className="text-[0.65rem] font-medium uppercase tracking-widest text-white/45">
          Direct share
        </p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Share your referral link"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#FDCD74] hover:text-[#5D4200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDCD74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B4D3E]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
        </button>
      </div>
    </div>
  );
}
