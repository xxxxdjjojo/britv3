"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare/useCompare";
import { GitCompareArrows } from "lucide-react";

export function CompareBar() {
  const { count, clearAll } = useCompare();

  if (count === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
      role="status"
      aria-live="polite"
      aria-label={`${count} of 3 providers selected for comparison`}
    >
      <div className="bg-surface/95 backdrop-blur-md shadow-xl border-t border-surface-container-highest">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm font-medium text-brand-primary">
              <span className="mr-1 font-bold text-brand-primary">{count}</span>
              of 3 providers selected for comparison
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-brand-primary/50 underline-offset-2 hover:underline hover:text-brand-primary transition-colors min-h-[44px] px-2"
              >
                Clear All
              </button>

              <Link
                href="/compare"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-all min-h-[44px]"
              >
                <GitCompareArrows className="w-4 h-4" />
                Compare Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
