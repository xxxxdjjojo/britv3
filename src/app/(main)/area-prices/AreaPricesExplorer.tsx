"use client";

/**
 * AreaPricesExplorer — the free, postcode-first "what sold near me" experience.
 *
 * Address combobox (postcodes.io suggestions via the ADDRESS_PROVIDER adapter)
 * → resolve to a postcode → market_map_postcode_card RPC → Flat/House median
 * bands (with the geography level actually used) + a choropleth map that flies
 * to the postcode. No paid address API; the map base is the existing
 * vector-tile choropleth.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";
import { MarketMapPriceCard } from "@/components/market-map/MarketMapPriceCard";
import type { PostcodeAreaCard } from "@/services/market-map/postcode-card-service";
import type { AddressSuggestion } from "@/services/address/address-provider";
import type { FitBoundsParams } from "@/lib/market-map/fit-bounds";
import { geographyLevelForZoom } from "@/lib/market-map/geography";
import { bandSubtitle, locationHeadline, METHODOLOGY_NOTE } from "./copy";

const MarketMap = dynamic(
  () => import("@/components/market-map/MarketMap").then((m) => ({ default: m.MarketMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-brand-primary-lighter/30">
        <p className="font-sans text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
);

/** Street-ish zoom so the map lands on the user's immediate area, honestly framed. */
const STREET_ZOOM = 14;

function fitToPostcode(lat: number, lng: number): FitBoundsParams {
  const delta = 0.008;
  return {
    bounds: [
      [lng - delta, lat - delta],
      [lng + delta, lat + delta],
    ],
    center: [lng, lat],
    zoom: STREET_ZOOM,
    geographyLevel: geographyLevelForZoom(STREET_ZOOM),
  };
}

type Status = "idle" | "loading" | "ready" | "empty" | "invalid" | "error";

export function AreaPricesExplorer() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<PostcodeAreaCard | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fitTo, setFitTo] = useState<FitBoundsParams | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced postcode suggestions from the address adapter. All state updates
  // happen inside the debounce callback (never synchronously in the effect body).
  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const id = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/address/autocomplete?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as { suggestions?: AddressSuggestion[] };
        setSuggestions(json.suggestions ?? []);
        setOpen(true);
      } catch {
        /* aborted or offline — leave prior suggestions */
      }
    }, 250);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  // Close the suggestion list on outside click.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const runLookup = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setOpen(false);
    setStatus("loading");
    setCard(null);

    // Resolve free text / postcode → a single postcode via the adapter seam.
    let postcode: string | null = null;
    try {
      const res = await fetch(`/api/address/resolve?q=${encodeURIComponent(text)}`);
      const json = (await res.json()) as { resolved: { postcode: string } | null };
      postcode = json.resolved?.postcode ?? null;
    } catch {
      setStatus("error");
      return;
    }
    if (!postcode) {
      setStatus("invalid");
      return;
    }

    try {
      const res = await fetch(
        `/api/market-map/postcode-card?postcode=${encodeURIComponent(postcode)}&window=12`,
      );
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = (await res.json()) as PostcodeAreaCard;
      setCard(data);
      if (data.found && data.location?.lat != null && data.location?.lng != null) {
        setFitTo(fitToPostcode(data.location.lat, data.location.lng));
      }
      const bothEmpty = data.flat.insufficient && data.house.insufficient;
      setStatus(!data.found || bothEmpty ? "empty" : "ready");
    } catch {
      setStatus("error");
    }
  }, []);

  function handleSelect(suggestion: AddressSuggestion) {
    setQuery(suggestion.label);
    setSuggestions([]);
    void runLookup(suggestion.postcode);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runLookup(query);
  }

  const hasResult = status === "ready" || status === "empty";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:gap-16 lg:py-20">
      {/* Hero + search */}
      <header className="flex flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/20 px-3.5 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-foreground ring-1 ring-inset ring-brand-gold/40">
          Free · No sign-up
        </span>
        <h1 className="font-heading text-[2.75rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-primary-dark sm:text-6xl">
          What do homes sell for
          <br className="hidden sm:block" /> in your area?
        </h1>
        <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-brand-primary-dark/65 sm:text-lg">
          Enter your postcode for the typical (median) sold price near you — split
          by flats and houses — straight from HM Land Registry data.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-3 w-full max-w-xl"
          role="search"
          aria-label="Find area sold prices by postcode"
        >
          <div ref={boxRef} className="relative">
            <div className="flex items-center gap-2 rounded-2xl border border-brand-primary/15 bg-white p-2 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.06),0_20px_44px_-16px_rgba(27,77,62,0.28)] transition-colors focus-within:border-brand-primary/40 focus-within:ring-2 focus-within:ring-brand-primary/15">
              <Search className="ml-2.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" />
              <label htmlFor="area-postcode" className="sr-only">
                Enter your address or postcode
              </label>
              <input
                id="area-postcode"
                type="text"
                inputMode="text"
                autoComplete="off"
                role="combobox"
                aria-expanded={open && suggestions.length > 0}
                aria-controls="area-postcode-listbox"
                aria-autocomplete="list"
                placeholder="Enter your address or postcode"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 font-sans text-base text-brand-primary-dark outline-none placeholder:text-brand-primary-dark/40"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-brand-primary px-6 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                {status === "loading" ? (
                  <Loader2 className="size-4 animate-spin" aria-label="Searching" />
                ) : (
                  "See prices"
                )}
              </button>
            </div>

            {open && suggestions.length > 0 && (
              <ul
                id="area-postcode-listbox"
                role="listbox"
                className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-brand-primary/10 bg-white py-1 text-left shadow-[0_2px_4px_-1px_rgba(27,77,62,0.06),0_16px_36px_-12px_rgba(27,77,62,0.24)]"
              >
                {suggestions.map((s) => (
                  <li key={s.postcode} role="option" aria-selected="false">
                    <button
                      type="button"
                      onClick={() => handleSelect(s)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 font-sans text-sm text-brand-primary-dark transition-colors hover:bg-brand-primary-lighter/50 focus:bg-brand-primary-lighter/50 focus:outline-none"
                    >
                      <MapPin className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Trust line */}
          <p className="mt-3.5 font-sans text-xs text-brand-primary-dark/50">
            Median sold prices · HM Land Registry · England &amp; Wales
          </p>
        </form>
      </header>

      {/* Status messages */}
      {status === "invalid" && (
        <p className="text-center font-sans text-sm text-brand-primary-dark/60" role="status">
          Enter a full UK postcode, e.g. <span className="font-semibold text-brand-primary-dark">M1 1AE</span>.
        </p>
      )}
      {status === "error" && (
        <p className="text-center font-sans text-sm text-red-600" role="status">
          Something went wrong fetching prices. Please try again.
        </p>
      )}

      {/* Result: cards + map */}
      {hasResult && card && (
        <section
          aria-label="Area sold prices"
          className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,23rem)_1fr] lg:items-start"
        >
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-brand-primary">
                <MapPin className="size-3.5" aria-hidden="true" />
                Sold prices
              </div>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-[-0.02em] text-brand-primary-dark">
                {locationHeadline(card.location) || "Your area"}
              </h2>
              <p className="mt-1.5 font-sans text-sm text-brand-primary-dark/60">
                Typical sold prices for the surrounding area.
              </p>
            </div>

            {status === "empty" ? (
              <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)]">
                <p className="font-heading text-base font-bold text-brand-primary-dark">
                  Not enough recent sales nearby
                </p>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-brand-primary-dark/60">
                  {card.found
                    ? "There weren’t enough registered sales in the last 12 months to show a reliable figure here."
                    : "We have sold-price data for England & Wales. Try a postcode there."}
                </p>
              </div>
            ) : (
              <MarketMapPriceCard
                card={{ flat: card.flat, house: card.house }}
                areaName={locationHeadline(card.location) || "Your area"}
                subtitles={{
                  flat: bandSubtitle(card.flat),
                  house: bandSubtitle(card.house),
                }}
              />
            )}

            <p className="font-sans text-xs leading-relaxed text-brand-primary-dark/45">
              {METHODOLOGY_NOTE}
            </p>
          </div>

          <div className="h-[380px] overflow-hidden rounded-3xl bg-white p-1.5 shadow-[0_2px_6px_-1px_rgba(27,77,62,0.06),0_28px_56px_-20px_rgba(27,77,62,0.30)] ring-1 ring-inset ring-brand-primary/10 lg:h-[560px]">
            <div className="h-full w-full overflow-hidden rounded-[1.25rem]">
              <MarketMap propertyType="all" months={12} scaleMode="national" fitTo={fitTo} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
