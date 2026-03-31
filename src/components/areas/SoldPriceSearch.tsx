"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SoldPriceRecord } from "@/types/areas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchResult = Pick<
  SoldPriceRecord,
  "slug" | "address" | "postcode" | "priceFormatted" | "dateFormatted" | "areaSlug"
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SoldPriceSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch results when debounced query changes
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/sold-prices/search?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as SearchResult[];
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by postcode or address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 && !isLoading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
          {results.map((result) => (
            <Link
              key={`${result.slug}-${result.areaSlug}`}
              href={`/sold-prices/${result.areaSlug}/${result.slug}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {result.address}
                </p>
                <p className="text-xs text-muted-foreground">{result.postcode}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-foreground">
                  {result.priceFormatted}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.dateFormatted}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
