/**
 * EmptyState — displayed when a search returns zero results.
 * Server Component (no "use client").
 */

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = Readonly<{
  title?: string;
  description?: string;
}>;

export function EmptyState({
  title = "No properties found",
  description = "Try adjusting your filters or search in a different area",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Icon */}
      <SearchX className="size-16 text-neutral-300 mb-6" aria-hidden="true" />

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h2>

      {/* Description */}
      <p className="text-neutral-500 max-w-sm mb-8">{description}</p>

      {/* Suggestion links */}
      <ul className="flex flex-col gap-3 mb-10 w-full max-w-xs">
        <li>
          <Link
            href="#"
            className="flex items-center justify-center gap-2 text-sm text-brand-primary hover:underline"
          >
            Widen your search area
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center justify-center gap-2 text-sm text-brand-primary hover:underline"
          >
            Adjust your budget
          </Link>
        </li>
        <li>
          <Link
            href="/search"
            className="flex items-center justify-center gap-2 text-sm text-brand-primary hover:underline"
          >
            Clear all filters
          </Link>
        </li>
      </ul>

      {/* CTA */}
      <Button variant="default" size="lg">
        Set up an alert for these criteria
      </Button>
    </div>
  );
}
