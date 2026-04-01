"use client";

import { useState, useEffect, useCallback } from "react";
import { Inbox, AlertCircle } from "lucide-react";
import { OfferCard } from "@/components/seller/offers/OfferCard";
import { OfferCompareTable } from "@/components/seller/offers/OfferCompareTable";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "pending" | "accepted" | "rejected";

export default function OffersReceivedPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await fetch("/api/seller/offers");
      if (!res.ok) throw new Error("Failed to load");
      setOffers(await res.json());
    } catch {
      setHasError(true);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const pendingCount = offers.filter((o) => o.status === "pending").length;
  const acceptedCount = offers.filter((o) => o.status === "accepted").length;
  const rejectedCount = offers.filter(
    (o) => o.status === "rejected" || o.status === "withdrawn",
  ).length;
  const highestOffer =
    offers.length > 0 ? Math.max(...offers.map((o) => o.amount)) : null;

  const filtered = offers.filter((o) => {
    if (filterTab === "pending") return o.status === "pending";
    if (filterTab === "accepted") return o.status === "accepted";
    if (filterTab === "rejected")
      return o.status === "rejected" || o.status === "withdrawn";
    return true;
  });

  const tabs: Array<{ key: FilterTab; label: string; count: number }> = [
    { key: "all", label: "All", count: offers.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "accepted", label: "Accepted", count: acceptedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-primary tracking-tight">
              Offers Received
            </h1>
            <p className="text-on-surface-variant mt-1 text-sm">
              {pendingCount} pending offer{pendingCount !== 1 ? "s" : ""}{" "}
              awaiting your response
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container shadow-sm transition-all"
            >
              Download Report
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-md transition-all"
            >
              Pause Viewings
            </button>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      {!loading && !hasError && offers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-outline font-semibold uppercase tracking-wider">
              Total Offers
            </p>
            <p className="text-3xl font-bold text-on-surface mt-1">
              {offers.length}
            </p>
            <p className="text-xs text-outline mt-0.5">received</p>
          </div>
          <div className="bg-secondary-container/20 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-secondary/70 font-semibold uppercase tracking-wider">
              Pending
            </p>
            <p className="text-3xl font-bold text-secondary mt-1">
              {pendingCount}
            </p>
            <p className="text-xs text-secondary/60 mt-0.5">need response</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-outline font-semibold uppercase tracking-wider">
              Highest Offer
            </p>
            <p className="text-3xl font-bold text-brand-primary mt-1">
              {highestOffer
                ? `£${(highestOffer / 100).toLocaleString("en-GB")}`
                : "—"}
            </p>
            <p className="text-xs text-outline mt-0.5">offer amount</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && !hasError && offers.length > 0 && (
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                filterTab === key
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    filterTab === key
                      ? "bg-primary-container/20 text-brand-primary"
                      : "bg-surface-container text-outline",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-6 animate-pulse h-80 shadow-sm"
            />
          ))}
        </div>
      ) : hasError ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-2xl shadow-sm">
          <AlertCircle
            size={32}
            className="mx-auto text-error mb-3"
            strokeWidth={1.25}
          />
          <p className="text-on-surface-variant text-sm font-medium">
            Failed to load offers
          </p>
          <button
            type="button"
            onClick={loadOffers}
            className="mt-4 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-2xl shadow-sm">
          <Inbox
            size={32}
            className="mx-auto text-outline mb-3"
            strokeWidth={1.25}
          />
          <p className="text-on-surface-variant text-sm font-medium">
            No offers received yet
          </p>
          <p className="text-outline text-xs mt-1">
            Offers on your active listings will appear here
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl shadow-sm">
          <p className="text-outline text-sm">
            No {filterTab !== "all" ? filterTab : ""} offers
          </p>
        </div>
      ) : (
        <>
          {/* Offer Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {filtered.map((offer, idx) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onUpdated={loadOffers}
                featured={idx === 0 && filterTab === "all"}
              />
            ))}
          </div>

          {/* Detailed Comparison Table */}
          {filtered.length >= 2 && (
            <section className="bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-5 flex justify-between items-center bg-primary-container/20">
                <h2 className="font-heading text-xl font-bold text-brand-primary">
                  Detailed Comparison
                </h2>
                <span className="text-xs font-semibold text-brand-primary bg-primary-container/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Side-by-Side View
                </span>
              </div>
              <OfferCompareTable
                offers={
                  filtered.filter((o) => o.status === "pending").length >= 2
                    ? filtered.filter((o) => o.status === "pending")
                    : filtered
                }
              />
              <div className="p-4 bg-surface-container-low flex justify-between items-center">
                <p className="text-xs text-outline">
                  All financials are verified by the Britestate Finance team.
                </p>
                <button
                  type="button"
                  className="text-brand-primary text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  View Complete Audit Trail
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
