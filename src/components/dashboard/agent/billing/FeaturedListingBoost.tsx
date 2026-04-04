"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Clock, TrendingUp } from "lucide-react";

type Listing = {
  id: string;
  title: string | null;
  address_line_1: string | null;
  city: string | null;
  postcode: string | null;
  price: number | null;
  status: string;
  featured_until: string | null;
};

type DurationOption = {
  days: number;
  label: string;
  price_gbp: number;
  // Stripe price IDs — these would come from env/config in production
  price_id: string;
};

const DURATION_OPTIONS: DurationOption[] = [
  { days: 7, label: "7 days", price_gbp: 9.99, price_id: "price_boost_7d" },
  { days: 14, label: "14 days", price_gbp: 17.99, price_id: "price_boost_14d" },
  { days: 30, label: "30 days", price_gbp: 29.99, price_id: "price_boost_30d" },
];

type Props = Readonly<{
  activeListings: Listing[];
  boostedListings: Listing[];
}>;

function formatGbp(pounds: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pounds);
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ListingCard({
  listing,
  selected,
  onSelect,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
}) {
  const address = [listing.address_line_1, listing.city, listing.postcode]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
        selected
          ? "border-brand-accent bg-brand-accent-light dark:bg-brand-accent/10"
          : "border-border hover:border-brand-accent/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {listing.title ?? address ?? "Untitled listing"}
          </p>
          {listing.title && (
            <p className="text-xs text-muted-foreground truncate">{address}</p>
          )}
          {listing.price != null && (
            <p className="text-sm font-semibold mt-1">
              {formatGbp(listing.price / 100)}
            </p>
          )}
        </div>
        {selected && <Check className="size-4 text-brand-accent shrink-0 mt-0.5" />}
      </div>
    </button>
  );
}

export function FeaturedListingBoost({ activeListings, boostedListings }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    activeListings[0]?.id ?? null,
  );
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(
    DURATION_OPTIONS[1],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedListing = activeListings.find((l) => l.id === selectedListingId);

  async function handlePurchase() {
    if (!selectedListingId || !selectedDuration) return;

    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const res = await fetch("/api/agent/billing?action=boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: selectedListingId,
          duration_days: selectedDuration.days,
          price_id: selectedDuration.price_id,
          success_url: `${origin}/dashboard/agent/billing/boost?success=1&listing_id=${selectedListingId}`,
          cancel_url: `${origin}/dashboard/agent/billing/boost`,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Currently boosted listings */}
      {boostedListings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="size-4 text-warning" />
              Currently Boosted Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boostedListings.map((listing) => {
                const address = [listing.address_line_1, listing.city, listing.postcode]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between rounded-md bg-warning-light dark:bg-warning/10 border border-warning/30 dark:border-warning/40 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{listing.title ?? address}</p>
                      {listing.title && (
                        <p className="text-xs text-muted-foreground">{address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning dark:text-warning">
                        <Star className="size-3" />
                        Featured
                      </span>
                      {listing.featured_until && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Until {formatDate(listing.featured_until)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? "bg-brand-accent text-white"
                  : step > s
                  ? "bg-success text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="size-3" /> : s}
            </div>
            <span
              className={`text-sm ${
                step === s ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {s === 1 ? "Select Listing" : s === 2 ? "Choose Duration" : "Preview & Purchase"}
            </span>
            {s < 3 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select listing */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select a Listing to Boost</CardTitle>
            <CardDescription>Choose which active listing you want to feature</CardDescription>
          </CardHeader>
          <CardContent>
            {activeListings.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground text-sm">No active listings available to boost.</p>
                <a
                  href="/dashboard/agent/listings/create"
                  className="text-sm text-brand-accent hover:underline mt-2 inline-block"
                >
                  Create a listing
                </a>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {activeListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    selected={selectedListingId === listing.id}
                    onSelect={() => setSelectedListingId(listing.id)}
                  />
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedListingId}
                className="bg-brand-accent hover:bg-brand-accent/90"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose duration */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Choose Boost Duration</CardTitle>
            <CardDescription>
              Boosted listings appear at the top of search results with a Featured badge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setSelectedDuration(opt)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    selectedDuration.days === opt.days
                      ? "border-brand-accent bg-brand-accent-light dark:bg-brand-accent/10"
                      : "border-border hover:border-brand-accent/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{opt.label}</p>
                      <p className="text-2xl font-bold mt-1">{formatGbp(opt.price_gbp)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatGbp(opt.price_gbp / opt.days)}/day
                      </p>
                    </div>
                    {selectedDuration.days === opt.days && (
                      <Check className="size-4 text-brand-accent" />
                    )}
                  </div>
                  {opt.days === 14 && (
                    <span className="mt-2 inline-block text-xs font-medium text-brand-accent bg-brand-accent-light dark:bg-brand-accent/20 rounded px-2 py-0.5">
                      Popular
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-brand-accent hover:bg-brand-accent/90"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview and purchase */}
      {step === 3 && selectedListing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview &amp; Purchase</CardTitle>
            <CardDescription>
              Review your boost order before payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Featured listing preview */}
            <div className="rounded-lg border-2 border-warning bg-warning-light dark:bg-warning/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                  <Star className="size-3" />
                  Featured
                </span>
                <span className="text-xs text-muted-foreground">Priority placement in search results</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {selectedListing.title ??
                      [selectedListing.address_line_1, selectedListing.city]
                        .filter(Boolean)
                        .join(", ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedListing.address_line_1, selectedListing.city, selectedListing.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {selectedListing.price != null && (
                    <p className="text-lg font-bold mt-1">
                      {formatGbp(selectedListing.price / 100)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-3" /> Higher in search rankings
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="size-3" /> Featured badge on listing card
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {selectedDuration.label} duration
                </span>
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h3 className="font-semibold text-sm">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Featured Listing Boost ({selectedDuration.label})</span>
                <span>{formatGbp(selectedDuration.price_gbp)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total (inc. VAT)</span>
                <span>{formatGbp(selectedDuration.price_gbp)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={() => void handlePurchase()}
                disabled={loading}
                className="bg-brand-accent hover:bg-brand-accent/90"
              >
                {loading ? "Redirecting to payment..." : `Purchase Boost — ${formatGbp(selectedDuration.price_gbp)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
