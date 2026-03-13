"use client";

/**
 * PortfolioFilter — Client Component
 *
 * Manages active category state for portfolio filtering. Renders category
 * pill filter chips above the masonry grid and filters items client-side.
 * Uses PortfolioLightbox for individual image items.
 */

import { useState } from "react";
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
      <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {providerName} hasn&apos;t added portfolio items yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-[#2563EB] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#2563EB] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Masonry grid */}
      <div className="[column-count:2] [column-gap:1rem] md:[column-count:3]">
        {filteredItems.map((item) => (
          <PortfolioLightbox key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && activeCategory !== null && (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center mt-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No items in this category.
          </p>
        </div>
      )}
    </div>
  );
}
