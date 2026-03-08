"use client";

/**
 * Search bar with postcode autocomplete and listing type toggle.
 * Uses usePostcodeAutocomplete for suggestions and useGeocode for lat/lng lookup.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "@/hooks/useSearch";
import { usePostcodeAutocomplete, useGeocode } from "@/hooks/useGeocode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, MapPinIcon } from "lucide-react";

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
      <div className="flex rounded-lg border bg-muted p-0.5">
        <button
          type="button"
          onClick={() => setParams({ listing_type: "sale" })}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            listingType === "sale"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          For Sale
        </button>
        <button
          type="button"
          onClick={() => setParams({ listing_type: "rent" })}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            listingType === "rent"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          To Rent
        </button>
      </div>

      {/* Location input with autocomplete */}
      <div className="relative flex-1">
        <div className="relative">
          <MapPinIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
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
            className="pl-9"
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full z-50 mt-1 w-full rounded-lg border bg-popover shadow-md"
          >
            {suggestions.map((postcode) => (
              <button
                key={postcode}
                type="button"
                onClick={() => handleSelectPostcode(postcode)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <MapPinIcon className="size-3.5 text-muted-foreground" />
                {postcode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search button */}
      <Button onClick={handleSearch} className="gap-2">
        <SearchIcon className="size-4" />
        Search
      </Button>
    </div>
  );
}
