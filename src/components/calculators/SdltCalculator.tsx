"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import { calculateLbtt } from "@/lib/calculators/lbtt";
import { calculateLtt } from "@/lib/calculators/ltt";
import type { BuyerType, SdltResult } from "@/types/calculators";

type Country = "england" | "scotland" | "wales";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const BUYER_TYPE_OPTIONS: Array<{ value: BuyerType; label: string; englandOnly?: boolean }> = [
  { value: "standard", label: "Moving Home / Standard" },
  { value: "first_time", label: "First-time Buyer" },
  { value: "additional", label: "Additional Property (Buy-to-let)", englandOnly: true },
];

const COUNTRY_OPTIONS: Array<{ value: Country; label: string }> = [
  { value: "england", label: "England & NI" },
  { value: "scotland", label: "Scotland" },
  { value: "wales", label: "Wales" },
];

const TAX_LABELS: Record<Country, { short: string; long: string }> = {
  england: { short: "SDLT", long: "Stamp Duty Land Tax" },
  scotland: { short: "LBTT", long: "Land and Buildings Transaction Tax" },
  wales: { short: "LTT", long: "Land Transaction Tax" },
};

const FOOTER_TEXT: Record<Country, string> = {
  england: "SDLT rates effective from 1 April 2025. England and Northern Ireland.",
  scotland: "LBTT rates per Revenue Scotland. Scotland.",
  wales: "LTT rates per Welsh Revenue Authority. Wales.",
};

// Bar colours for stacked chart — green gradient progression
const BAND_COLORS = [
  "bg-brand-primary-lighter",
  "bg-brand-primary/40",
  "bg-brand-primary/70",
  "bg-brand-primary",
  "bg-brand-primary-light",
];

function getUrlParam(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null && !isNaN(Number(val)) ? Number(val) : defaultValue;
}

function getUrlString<T extends string>(key: string, defaultValue: T, allowed: T[]): T {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key) as T;
  return val !== null && allowed.includes(val) ? val : defaultValue;
}

type SdltCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

export function SdltCalculator({ initialPrice }: SdltCalculatorProps = {}) {
  const [country, setCountry] = useState<Country>(() =>
    getUrlString("country", "england", ["england", "scotland", "wales"])
  );
  const [buyerType, setBuyerType] = useState<BuyerType>(() =>
    getUrlString("buyer", "standard", ["standard", "first_time", "additional"])
  );
  const [propertyPrice, setPropertyPrice] = useState(() =>
    initialPrice ?? getUrlParam("price", 300000)
  );

  // Sync state to URL (disabled when embedded with initialPrice)
  useEffect(() => {
    if (initialPrice != null) return;
    const params = new URLSearchParams();
    if (propertyPrice !== 300000) params.set("price", String(propertyPrice));
    if (country !== "england") params.set("country", country);
    if (buyerType !== "standard") params.set("buyer", buyerType);
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [propertyPrice, country, buyerType, initialPrice]);

  // Reset buyer type if switching away from England with "additional" selected
  const effectiveBuyerType =
    country !== "england" && buyerType === "additional" ? "standard" : buyerType;

  const result: SdltResult = useMemo(() => {
    switch (country) {
      case "scotland":
        return calculateLbtt(propertyPrice, effectiveBuyerType === "first_time");
      case "wales":
        return calculateLtt(propertyPrice);
      case "england":
      default:
        return calculateSdlt(propertyPrice, effectiveBuyerType);
    }
  }, [propertyPrice, effectiveBuyerType, country]);

  // Calculate bar widths for stacked bar chart
  const barSegments = useMemo(() => {
    if (propertyPrice <= 0) return [];
    return result.bands.map((band) => {
      const bandWidth = band.to - band.from;
      const widthPct = (bandWidth / propertyPrice) * 100;
      return { widthPct, rate: (band.rate * 100).toFixed(0) };
    });
  }, [result.bands, propertyPrice]);

  const taxLabel = TAX_LABELS[country];
  const visibleBuyerTypes = BUYER_TYPE_OPTIONS.filter(
    (opt) => !opt.englandOnly || country === "england",
  );

  return (
    <div className="space-y-8">
      {/* ── Input Section ── */}
      <section className="rounded-xl border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {/* Country selector */}
        <div className="mb-7">
          <Label className="mb-3 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Country
          </Label>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCountry(opt.value);
                  if (opt.value !== "england" && buyerType === "additional") {
                    setBuyerType("standard");
                  }
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  country === opt.value
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-brand-primary/50 hover:text-brand-primary dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Property Price */}
          <div>
            <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Property Price
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">
                £
              </span>
              <Input
                type="number"
                min={0}
                step={1000}
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className="h-12 bg-neutral-50 pl-8 text-base font-medium dark:bg-neutral-800 dark:border-neutral-700"
                placeholder="e.g. 250,000"
              />
            </div>
            {propertyPrice > 0 && result.totalTax === 0 && (
              <p className="mt-2 text-xs font-medium text-brand-primary">
                No {taxLabel.short} payable on this amount.
              </p>
            )}
          </div>

          {/* Buyer Type */}
          <div>
            <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Buyer Type
              {country === "wales" && (
                <span className="ml-2 normal-case text-neutral-400">
                  (no first-time relief)
                </span>
              )}
            </Label>
            <RadioGroup
              value={country === "wales" ? "standard" : effectiveBuyerType}
              onValueChange={(val) => setBuyerType(val as BuyerType)}
              className="space-y-2"
            >
              {visibleBuyerTypes.map((option) => {
                const disabled = country === "wales" && option.value === "first_time";
                const isActive =
                  (country === "wales" ? "standard" : effectiveBuyerType) === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                      disabled
                        ? "cursor-not-allowed opacity-40 border-neutral-200 dark:border-neutral-700"
                        : isActive
                          ? "border-brand-primary bg-brand-primary-lighter/50 dark:bg-brand-primary/10"
                          : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`sdlt-${option.value}`}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`sdlt-${option.value}`}
                      className={`ml-3 text-sm font-medium ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {option.label}
                    </Label>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* ── Results Panel ── */}
      <section className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {/* Top result bar — gradient background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-light px-8 py-7">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
                Total {taxLabel.short}
              </p>
              <div className="font-heading text-5xl font-bold text-white">
                {formatCurrency(result.totalTax)}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white">
              <span className="text-sm font-bold">
                Effective Rate: {(result.effectiveRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stacked Bar Chart */}
          {barSegments.length > 0 && propertyPrice > 0 && (
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                  Tax Band Breakdown
                </span>
                <span className="text-xs text-neutral-400 italic">
                  {formatCurrency(propertyPrice)}
                </span>
              </div>
              <div className="flex h-8 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                {barSegments.map((seg, i) => (
                  <div
                    key={i}
                    className={`h-full ${BAND_COLORS[i] ?? BAND_COLORS[BAND_COLORS.length - 1]}`}
                    style={{ width: `${seg.widthPct}%` }}
                    title={`${seg.rate}% band`}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {barSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${BAND_COLORS[i] ?? BAND_COLORS[BAND_COLORS.length - 1]}`}
                    />
                    <span className="text-xs text-neutral-500">{seg.rate}% rate</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threshold Breakdown table */}
          {result.bands.length > 0 && (
            <>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Threshold Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      <th className="pb-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Property Value Band
                      </th>
                      <th className="pb-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Rate
                      </th>
                      <th className="pb-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Tax Payable
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                    {result.bands.map((band, i) => (
                      <tr key={i} className="group">
                        <td className="py-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                          {formatCurrency(band.from)} – {formatCurrency(band.to)}
                        </td>
                        <td className="py-3.5 text-sm font-medium text-neutral-900 dark:text-white">
                          {(band.rate * 100).toFixed(0)}%
                        </td>
                        <td className="py-3.5 text-right text-sm font-semibold text-neutral-900 dark:text-white">
                          {formatCurrency(band.tax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-neutral-100 dark:border-neutral-800">
                      <td
                        className="py-4 text-sm font-bold text-neutral-900 dark:text-white"
                        colSpan={2}
                      >
                        Total {taxLabel.short} Payable
                      </td>
                      <td className="py-4 text-right text-base font-bold text-brand-primary">
                        {formatCurrency(result.totalTax)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          <p className="mt-5 text-[11px] text-neutral-400 italic">
            {FOOTER_TEXT[country]}
          </p>
        </div>
      </section>
    </div>
  );
}
