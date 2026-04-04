/**
 * PortfolioTab — Server Component frame
 *
 * Renders the portfolio gallery section heading and delegates the masonry
 * grid + filter chips to the PortfolioFilter client component.
 */

import { PortfolioFilter } from "@/components/providers/PortfolioFilter";
import type { PortfolioItem } from "@/types/providers";

type PortfolioTabProps = Readonly<{
  items: PortfolioItem[];
  providerName: string;
}>;

export function PortfolioTab({ items, providerName }: PortfolioTabProps) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Portfolio ({items.length})
        </h2>
      </div>

      {/* Client-rendered filter + masonry grid */}
      <PortfolioFilter items={items} providerName={providerName} />
    </div>
  );
}
