"use client";

import { useState, useCallback } from "react";

type Listing = Readonly<{ id: string; title: string; address: string }>;

const BOOST_OPTIONS = [
  { days: 7, price: "19.99", priceId: "price_boost_7d" },
  { days: 14, price: "34.99", priceId: "price_boost_14d" },
  { days: 30, price: "59.99", priceId: "price_boost_30d" },
] as const;

export function FeaturedListingBoost(
  props: Readonly<{ listings: Listing[] }>,
) {
  const [selectedListing, setSelectedListing] = useState(
    props.listings[0]?.id ?? "",
  );
  const [selectedOption, setSelectedOption] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  const selected = props.listings.find((l) => l.id === selectedListing);
  const option = BOOST_OPTIONS[selectedOption];

  const handlePurchase = useCallback(async () => {
    if (!selectedListing || !option) return;

    setPurchasing(true);
    try {
      const res = await fetch("/api/agent/billing?action=boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: selectedListing,
          duration_days: String(option.days),
          price_id: option.priceId,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url: string };
        window.location.href = data.url;
      }
    } catch {
      // silent on error
    } finally {
      setPurchasing(false);
    }
  }, [selectedListing, option]);

  if (props.listings.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Featured Listing Boost
        </h1>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No active listings available to boost. Create a listing first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Featured Listing Boost
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1: Select Listing */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
              Step 1: Select Listing
            </h2>
            <select
              value={selectedListing}
              onChange={(e) => setSelectedListing(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {props.listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} {l.address ? `- ${l.address}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Duration */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
              Step 2: Select Duration
            </h2>
            <div className="space-y-2">
              {BOOST_OPTIONS.map((opt, i) => (
                <label
                  key={opt.days}
                  className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition ${
                    selectedOption === i
                      ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="boost-duration"
                      checked={selectedOption === i}
                      onChange={() => setSelectedOption(i)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {opt.days} days
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {`\u00A3${opt.price}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <button
            type="button"
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {purchasing ? "Processing..." : "Purchase Boost"}
          </button>
        </div>

        {/* Step 3: Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
            Step 3: Preview
          </h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-900">
            {/* Featured Badge */}
            <div className="mb-3 inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
              Featured
            </div>
            {/* Listing preview */}
            <div className="mb-2 h-32 rounded-md bg-gray-200 dark:bg-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selected?.title ?? "Select a listing"}
            </h3>
            {selected?.address && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selected.address}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{`${option.days} day boost`}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {`\u00A3${option.price}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
