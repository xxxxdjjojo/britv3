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
    <div className="flex flex-col">
      <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#1B4D3E]">
        Move up the list.
      </h2>
      <p className="mt-2 leading-relaxed text-[#1B4D3E]/65">
        Share your private link — each friend who joins moves you up the queue
        and unlocks tier rewards.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="referral-share-url" className="sr-only">
          Your referral link
        </label>
        <div className="flex flex-1 items-center gap-3 rounded-full border border-[#1B4D3E]/15 bg-[#F5ECD7]/30 px-5 focus-within:border-[#A07D2E]">
          <span aria-hidden className="text-[#1B4D3E]/40">
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
            className="h-12 w-full truncate bg-transparent text-sm font-medium text-[#1B4D3E] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#1B4D3E] px-7 text-sm font-semibold text-white transition duration-300 ease-out hover:bg-[#003629] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A07D2E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <p className="text-[0.65rem] font-medium uppercase tracking-widest text-[#1B4D3E]/45">
          Direct share
        </p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Share your referral link"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F5ECD7]/50 text-[#1B4D3E] transition-colors hover:bg-[#FDCD74] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A07D2E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
