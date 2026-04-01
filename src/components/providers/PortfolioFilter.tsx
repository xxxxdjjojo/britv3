"use client";

/**
 * PortfolioFilter — Client Component
 *
 * "Invisible Estate" design: brand-primary active filter chips (no borders),
 * masonry grid of portfolio images, empty state with icon.
 *
 * Manages active category state for portfolio filtering. Renders category
 * pill filter chips above the masonry grid and filters items client-side.
 * Uses PortfolioLightbox for individual image items.
 */

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { PortfolioLightbox } from "@/components/providers/PortfolioLightbox";
import type { PortfolioItem } from "@/types/providers";

type PortfolioFilterProps = Readonly<{
  items: PortfolioItem[];
  providerName: string;
}>;

export function PortfolioFilter({ items, providerName }: PortfolioFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Derive unique categories from items
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean) as string[]),
  ).sort();

  const filteredItems =
    activeCategory === null
      ? items
      : items.filter((item) => item.category === activeCategory);

  if (items.length === 0) {
    return (
      <div className="py-16 rounded-2xl bg-surface-container-low dark:bg-neutral-900 text-center">
        <ImageIcon className="w-10 h-10 text-neutral-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">No portfolio items yet</p>
        <p className="text-sm text-neutral-400 mt-1">
          {providerName} hasn&apos;t added project photos yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter chips — brand-primary active, surface-shift inactive */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            aria-pressed={activeCategory === null}
            className={`min-h-[36px] px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-surface-container-low dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`min-h-[36px] px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-brand-primary text-white shadow-sm"
                  : "bg-surface-container-low dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Masonry grid */}
      <div className="[column-count:2] [column-gap:0.75rem] md:[column-count:3]">
        {filteredItems.map((item) => (
          <PortfolioLightbox key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && activeCategory !== null && (
        <div className="py-12 rounded-2xl bg-surface-container-low dark:bg-neutral-900 text-center mt-4">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
            No items in this category
          </p>
        </div>
      )}
    </div>
  );
}
