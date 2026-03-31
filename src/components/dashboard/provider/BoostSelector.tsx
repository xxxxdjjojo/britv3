"use client";

import { useState } from "react";
import type { BoostType, ProviderBoost } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DurationWeeks = 1 | 2 | 4;

type BoostOption = Readonly<{
  type: BoostType;
  label: string;
  pricePerWeekPence: number;
  tagline: string;
  features: string[];
  badge?: string;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOOST_OPTIONS: BoostOption[] = [
  {
    type: "featured_profile",
    label: "Featured Profile",
    pricePerWeekPence: 2900,
    tagline: "Stand out with pinned placement and a featured badge.",
    features: [
      "Pinned placement in search results",
      "Featured badge on your profile",
      "Priority job alerts",
      "Profile highlighted in category listings",
    ],
  },
  {
    type: "area_spotlight",
    label: "Area Spotlight",
    pricePerWeekPence: 4900,
    tagline: "Dominate your local area with 3× increased visibility.",
    features: [
      "Area banner placement",
      "3× search visibility boost",
      "Top position in area-filtered searches",
      "Area spotlight badge on profile",
    ],
    badge: "Most Popular",
  },
  {
    type: "category_top",
    label: "Category Top",
    pricePerWeekPence: 7900,
    tagline: "Maximum exposure across homepage, newsletter, and your category.",
    features: [
      "Homepage banner placement",
      "Featured in weekly tradesperson newsletter",
      "Premium badge on profile",
      "Category top position guaranteed",
    ],
    badge: "Best Value",
  },
];

const DURATION_OPTIONS: DurationWeeks[] = [1, 2, 4];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function penceToGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function daysUntilExpiry(endsAt: string): number {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function progressPct(startsAt: string, endsAt: string): number {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (end <= start) return 100;
  const elapsed = now - start;
  const total = end - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function boostTypeLabel(type: BoostType): string {
  const map: Record<BoostType, string> = {
    featured_profile: "Featured Profile",
    area_spotlight: "Area Spotlight",
    category_top: "Category Top",
  };
  return map[type];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActiveBoostCard({ boost }: Readonly<{ boost: ProviderBoost }>) {
  const daysLeft = daysUntilExpiry(boost.ends_at);
  const pct = progressPct(boost.starts_at, boost.ends_at);
  const totalDays = boost.duration_days;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
            Active
          </span>
          <h3 className="mt-2 text-base font-semibold text-neutral-900">
            {boostTypeLabel(boost.boost_type)}
          </h3>
          {boost.coverage_area && (
            <p className="mt-0.5 text-sm text-neutral-500">
              Coverage: {boost.coverage_area}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-neutral-700">
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
          </p>
          <p className="text-xs text-neutral-400">
            of {totalDays} day{totalDays !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-2 rounded-full bg-brand-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-neutral-400">
          {pct}% elapsed
        </p>
      </div>
    </div>
  );
}

function BoostOptionCard({
  option,
  stripeEnabled,
}: Readonly<{
  option: BoostOption;
  stripeEnabled: boolean;
}>) {
  const [duration, setDuration] = useState<DurationWeeks>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPence = option.pricePerWeekPence * duration;

  async function handleBoostNow() {
    if (!stripeEnabled) {
      setError("Stripe is not enabled in this environment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/provider/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boost_type: option.type,
          duration_weeks: duration,
          amount_pence: totalPence,
        }),
      });

      const data = (await res.json()) as { checkout_url?: string; error?: string };

      if (!res.ok || !data.checkout_url) {
        throw new Error(data.error ?? "Failed to create checkout session.");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const isPopular = option.badge === "Most Popular";
  const isBest = option.badge === "Best Value";

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 shadow-sm ${
        isPopular
          ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary"
          : "border-neutral-200 bg-white"
      }`}
    >
      {option.badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
            isPopular
              ? "bg-brand-primary text-white"
              : isBest
                ? "bg-warning text-white"
                : "bg-neutral-700 text-white"
          }`}
        >
          {option.badge}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-neutral-900">{option.label}</h3>
        <p className="mt-1 text-sm text-neutral-500">{option.tagline}</p>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-neutral-900">
          {penceToGbp(option.pricePerWeekPence)}
          <span className="text-base font-normal text-neutral-500">/week</span>
        </p>
      </div>

      <ul className="mb-6 space-y-2 flex-1">
        {option.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* Duration selector */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Duration
        </p>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setDuration(w)}
              className={`flex-1 rounded-lg border py-1.5 text-sm font-medium transition-colors ${
                duration === w
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              {w}w
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-neutral-500">Total ({duration} week{duration !== 1 ? "s" : ""})</span>
        <span className="font-semibold text-neutral-900">{penceToGbp(totalPence)}</span>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-error-light px-3 py-2 text-xs text-error">{error}</p>
      )}

      <button
        type="button"
        onClick={handleBoostNow}
        disabled={loading || !stripeEnabled}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isPopular
            ? "bg-brand-primary text-white hover:bg-brand-primary/90"
            : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        {loading ? "Redirecting…" : stripeEnabled ? "Boost Now" : "Stripe not configured"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type BoostSelectorProps = Readonly<{
  activeBoosts: ProviderBoost[];
  stripeEnabled: boolean;
}>;

export function BoostSelector({ activeBoosts, stripeEnabled }: BoostSelectorProps) {
  return (
    <div className="space-y-8">
      {/* Active Promotions */}
      {activeBoosts.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Active Promotions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeBoosts.map((boost) => (
              <ActiveBoostCard key={boost.id} boost={boost} />
            ))}
          </div>
        </section>
      )}

      {/* Purchase section */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Purchase a Boost</h2>
        <p className="mb-6 text-sm text-neutral-500">
          Increase your visibility and win more jobs with a targeted promotion.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BOOST_OPTIONS.map((option) => (
            <BoostOptionCard
              key={option.type}
              option={option}
              stripeEnabled={stripeEnabled}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
