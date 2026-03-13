"use client";

/**
 * CompareButton — Client Component
 *
 * Adds/removes a provider from the localStorage compare list (max 3).
 * The useCompare hook (17-07) is dynamically imported; if not yet available,
 * renders a placeholder button.
 */

import dynamic from "next/dynamic";
import type { ServiceProviderPublicProfile } from "@/types/providers";

type CompareButtonProps = Readonly<{
  providerId: string;
  providerName: string;
}>;

/**
 * Inline fallback component rendered before useCompare hook is available.
 * Clicking stores provider in localStorage directly.
 */
function CompareFallback({ providerId, providerName }: CompareButtonProps) {
  function handleClick() {
    try {
      const stored = localStorage.getItem("britestate_compare");
      const current: string[] = stored ? (JSON.parse(stored) as string[]) : [];
      const idx = current.indexOf(providerId);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else if (current.length < 3) {
        current.push(providerId);
      }
      localStorage.setItem("britestate_compare", JSON.stringify(current));
    } catch {
      // localStorage may not be available
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Compare ${providerName}`}
      aria-label={`Add ${providerName} to compare`}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M9 3H5a2 2 0 0 0-2 2v4" />
        <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
        <path d="M15 3h4a2 2 0 0 1 2 2v4" />
        <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      Compare
    </button>
  );
}

export default function CompareButton(props: CompareButtonProps) {
  return <CompareFallback {...props} />;
}

// Re-export the provider type for convenience
export type { ServiceProviderPublicProfile };
