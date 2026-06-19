/**
 * EmptyState — displayed when a search returns zero results.
 * Server Component (no "use client") — but the optional `onChange` reset
 * callback is invoked by a plain <button>, which is fine inside a Client tree.
 */

import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SearchState } from "@/lib/search/url-state";

type EmptyStateProps = Readonly<{
  title?: string;
  description?: string;
  /**
   * Subset of SearchState the empty-state cares about. Optional so the
   * component still works in legacy call sites without a SearchState in scope.
   */
  state?: Pick<SearchState, "soldWithin">;
  /** Patch handler matching RefineFilters' onChange shape. */
  onChange?: (patch: Partial<SearchState>) => void;
}>;

export function EmptyState({
  title = "No properties match your filters",
  description = "Try adjusting your search criteria to find more results.",
  state,
  onChange,
}: EmptyStateProps) {
  const showSoldWithinHint =
    state?.soldWithin !== undefined && state.soldWithin !== "all" && !!onChange;
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-neutral-100 mb-6">
        <SearchX className="size-10 text-neutral-400" aria-hidden="true" />
      </div>

      <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">
        {title}
      </h2>

      <p className="text-neutral-500 text-base max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {showSoldWithinHint && (
        <p className="mt-2 mb-8 max-w-md text-sm text-neutral-500">
          Only listings whose last sale is in HM Land Registry can be filtered
          by date.{" "}
          <button
            type="button"
            onClick={() => onChange?.({ soldWithin: "all" })}
            className="font-bold text-brand-primary underline-offset-2 hover:underline"
          >
            Show all
          </button>{" "}
          to see listings without a recorded sale.
        </p>
      )}

      <ul className="text-neutral-600 text-sm space-y-2 mb-8 text-left">
        <li>• Try widening your search area</li>
        <li>• Adjust your budget range</li>
        <li>• Remove some filters</li>
      </ul>

      <Link href="/search" className={buttonVariants({ variant: "default" })}>
        Set up an alert for these criteria
      </Link>
    </div>
  );
}
