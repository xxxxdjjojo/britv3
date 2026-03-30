/**
 * EmptyState — displayed when a search returns zero results.
 * Matches the Britestate "Invisible Estate" design system.
 */

import Link from "next/link";
import { SearchX, Bell, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = Readonly<{
  title?: string;
  description?: string;
}>;

export function EmptyState({
  title = "No properties match your filters",
  description = "Try adjusting your search criteria to find more results.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      {/* Icon */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-neutral-100">
        <SearchX className="size-9 text-neutral-400" aria-hidden="true" />
      </div>

      <h2 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 mb-2">
        {title}
      </h2>

      <p className="max-w-md text-base leading-relaxed text-neutral-500 mb-8">
        {description}
      </p>

      <ul className="mb-8 space-y-2 text-left text-sm text-neutral-600">
        <li className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 text-xs">•</span>
          Try widening your search area
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 text-xs">•</span>
          Adjust your budget range
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 text-xs">•</span>
          Remove some property type filters
        </li>
      </ul>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/search"
          className={cn(
            buttonVariants({ variant: "default" }),
            "gap-2 rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary/90",
          )}
        >
          <Bell className="size-4" />
          Set up an alert for these criteria
        </Link>
        <Link
          href="/search"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "gap-1.5 rounded-xl text-neutral-600 hover:text-neutral-900",
          )}
        >
          Clear all filters
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
