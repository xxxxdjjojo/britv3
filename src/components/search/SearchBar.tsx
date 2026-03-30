"use client";

/**
 * Search bar with postcode autocomplete and listing type toggle.
 * Matches the Britestate "Invisible Estate" design system.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "@/hooks/useSearch";
import { usePostcodeAutocomplete, useGeocode } from "@/hooks/useGeocode";
import { Button } from "@/components/ui/button";
import { SearchIcon, MapPinIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [params, setParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(params.postcode ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPostcode, setSelectedPostcode] = useState<string | null>(
    params.postcode ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = usePostcodeAutocomplete(
    showSuggestions ? inputValue : null,
  );
  const { data: geocoded } = useGeocode(selectedPostcode);

  // When geocode resolves, update search params
  useEffect(() => {
    if (geocoded && selectedPostcode) {
      setParams({
        lat: String(geocoded.lat),
        lng: String(geocoded.lng),
        postcode: selectedPostcode,
        radius: params.radius ?? 5,
      });
    }
  }, [geocoded, selectedPostcode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPostcode = useCallback((postcode: string) => {
    setInputValue(postcode);
    setSelectedPostcode(postcode);
    setShowSuggestions(false);
  }, []);

  const handleSearch = useCallback(() => {
    if (inputValue.trim()) {
      setSelectedPostcode(inputValue.trim());
    }
    setShowSuggestions(false);
  }, [inputValue]);

  const listingType = params.listing_type ?? "sale";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
      {/* Listing type toggle */}
      <div className="flex rounded-xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setParams({ listing_type: "sale" })}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150",
            listingType === "sale"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          For Sale
        </button>
        <button
          type="button"
          onClick={() => setParams({ listing_type: "rent" })}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150",
            listingType === "rent"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          To Rent
        </button>
      </div>

      {/* Location input with autocomplete */}
      <div className="relative flex-1">
        <div className="relative flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-3 ring-1 ring-neutral-200 transition focus-within:ring-2 focus-within:ring-brand-primary">
          <MapPinIcon className="size-4 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter postcode or area name..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (inputValue.length >= 2) setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                setSelectedPostcode(null);
              }}
              className="shrink-0 text-neutral-400 hover:text-neutral-700 transition-colors"
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-neutral-200"
          >
            {suggestions.map((postcode) => (
              <button
                key={postcode}
                type="button"
                onClick={() => handleSelectPostcode(postcode)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <MapPinIcon className="size-3.5 shrink-0 text-neutral-400" />
                {postcode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search button */}
      <Button
        onClick={handleSearch}
        className="gap-2 rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary/90"
      >
        <SearchIcon className="size-4" />
        Search
      </Button>
    </div>
  );
}
