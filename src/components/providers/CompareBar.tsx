"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare/useCompare";

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
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border-t border-gray-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
              <span className="mr-1 text-[#2563EB] font-semibold">{count}</span>
              of 3 providers selected
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-gray-500 dark:text-slate-400 underline-offset-2 hover:underline hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
              >
                Clear All
              </button>

              <Link
                href="/compare"
                className="inline-flex items-center justify-center rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] transition-colors"
              >
                Compare Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
