"use client";

/**
 * The hero / landing property search bar — a REAL, wired location input.
 *
 * Replaces the previous dead `<Link>`/`<span>` shell (you could not type into
 * it). Submitting navigates to `/search?type=<tab>&q=<location>`, where the
 * server action filters listings by the typed area / city / postcode.
 *
 * Reused on the homepage hero (with Buy/Rent/Services tabs) and on renter
 * surfaces (rent-scoped, `showTabs={false}`).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ListingTab = "buy" | "rent";

const TABS: ReadonlyArray<{ value: ListingTab; label: string }> = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
];

type HomeSearchBarProps = Readonly<{
  /** Listing type the search defaults to. */
  defaultType?: ListingTab;
  /** Show the Buy/Rent tab switcher above the bar. */
  showTabs?: boolean;
  /** Submit-button label (hero shows "Ask AI"; rent surfaces show "Search"). */
  submitLabel?: string;
  /** Placeholder for the location input. */
  placeholder?: string;
  className?: string;
}>;

export function HomeSearchBar({
  defaultType = "buy",
  showTabs = true,
  submitLabel = "Ask AI",
  placeholder = "Search by town, postcode or address…",
  className,
}: HomeSearchBarProps) {
  const router = useRouter();
  const [type, setType] = useState<ListingTab>(defaultType);
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <div className={cn("w-full", className)}>
      {showTabs && (
        <div className="mx-auto mb-4 flex w-fit justify-center gap-1 rounded-lg bg-white/20 p-1 backdrop-blur-md">
          {TABS.map((tab) => {
            const active = type === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={active}
                onClick={() => setType(tab.value)}
                className={cn(
                  "rounded-md px-6 py-2 text-sm transition-colors",
                  active
                    ? "bg-white font-bold text-brand-primary shadow-sm"
                    : "font-medium text-white hover:bg-white/10",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        role="search"
        className="flex h-14 w-full items-stretch rounded-xl bg-white shadow-xl ring-4 ring-black/5 transition-shadow focus-within:ring-brand-primary/30 hover:ring-brand-primary/20 sm:h-16"
      >
        <div className="flex items-center justify-center rounded-l-xl pl-5 pr-3 text-neutral-400">
          <Search className="size-5" aria-hidden="true" />
        </div>
        <input
          type="text"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search by town, postcode or address"
          placeholder={placeholder}
          className="w-full min-w-0 flex-1 bg-transparent px-2 text-base font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <div className="flex items-center justify-center rounded-r-xl pr-2">
          <button
            type="submit"
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-primary px-5 text-sm font-bold text-white shadow-md transition-transform hover:bg-brand-primary-light active:scale-95 sm:h-12 sm:px-6 sm:text-base"
          >
            <Sparkles className="size-[18px]" aria-hidden="true" />
            <span className="hidden sm:inline">{submitLabel}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
