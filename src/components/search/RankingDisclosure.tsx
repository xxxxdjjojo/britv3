import Link from "next/link";

import { SEARCH_RANKING_DISCLOSURE } from "@/config/pledges";
import { cn } from "@/lib/utils";

/**
 * Quiet one-line ranking disclosure for property results pages (Campaign 43).
 * Renders the exact pledge-backed line from @/config/pledges with a subtle
 * link to the no-premium-placement pledge. Server-safe and client-safe — no
 * server-only imports, so it works inside the client search pages.
 */
export function RankingDisclosure({
  className,
}: Readonly<{ className?: string }>) {
  return (
    <p className={cn("text-xs text-neutral-500", className)}>
      {SEARCH_RANKING_DISCLOSURE}{" "}
      <Link
        href="/pledges/no-premium-placement"
        className="underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-brand-primary hover:decoration-brand-primary"
      >
        Our pledge
      </Link>
    </p>
  );
}
