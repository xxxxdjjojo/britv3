"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutList,
  Columns,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { OfferCard } from "@/components/seller/offers/OfferCard";
import { OfferCompareTable } from "@/components/seller/offers/OfferCompareTable";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "compare";
type FilterTab = "all" | "pending" | "accepted" | "rejected";

export default function OffersReceivedPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1c1c] tracking-tight">
            Offers Received
          </h1>
          <p className="text-sm text-[#1a1c1c]/60 mt-0.5">
            {pendingCount} pending offer{pendingCount !== 1 ? "s" : ""} awaiting
            your response
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-[#f4f3f2] rounded-xl p-1 flex-shrink-0">
          {(["list", "compare"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                viewMode === mode
                  ? "bg-white text-[#1a1c1c] shadow-sm"
                  : "text-[#1a1c1c]/50 hover:text-[#1a1c1c]",
              )}
              aria-label={mode === "list" ? "List view" : "Compare view"}
            >
              {mode === "list" ? (
                <LayoutList size={16} strokeWidth={1.25} />
              ) : (
                <Columns size={16} strokeWidth={1.25} />
              )}
              <span className="hidden sm:inline">
                {mode === "list" ? "List" : "Compare"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      {!loading && !hasError && offers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#faf9f8] rounded-xl p-4">
            <p className="text-xs text-[#1a1c1c]/50 font-medium">Total</p>
            <p className="text-2xl font-bold text-[#1a1c1c] mt-1">
              {offers.length}
            </p>
            <p className="text-xs text-[#1a1c1c]/40 mt-0.5">offers received</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs text-amber-700/70 font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {pendingCount}
            </p>
            <p className="text-xs text-amber-600/60 mt-0.5">need response</p>
          </div>
          <div className="bg-[#faf9f8] rounded-xl p-4">
            <p className="text-xs text-[#1a1c1c]/50 font-medium">Highest</p>
            <p className="text-2xl font-bold text-[#1a1c1c] mt-1">
              {highestOffer
                ? `£${(highestOffer / 100).toLocaleString("en-GB")}`
                : "—"}
            </p>
            <p className="text-xs text-[#1a1c1c]/40 mt-0.5">offer amount</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && !hasError && offers.length > 0 && (
        <div className="flex items-center gap-1 bg-[#f4f3f2] rounded-xl p-1 w-fit">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterTab(key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                filterTab === key
                  ? "bg-white text-[#1a1c1c] shadow-sm"
                  : "text-[#1a1c1c]/50 hover:text-[#1a1c1c]",
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    filterTab === key
                      ? "bg-[#1B4D3E]/10 text-[#1B4D3E]"
                      : "bg-[#1a1c1c]/10 text-[#1a1c1c]/40",
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#faf9f8] rounded-2xl p-6 animate-pulse h-44"
            />
          ))}
        </div>
      ) : hasError ? (
        <div className="text-center py-20 bg-[#faf9f8] rounded-2xl">
          <AlertCircle
            size={32}
            className="mx-auto text-red-400 mb-3"
            strokeWidth={1.25}
          />
          <p className="text-[#1a1c1c]/50 text-sm font-medium">
            Failed to load offers
          </p>
          <button
            type="button"
            onClick={loadOffers}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] transition-colors"
          >
            Try again
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-[#faf9f8] rounded-2xl">
          <Inbox
            size={32}
            className="mx-auto text-[#1a1c1c]/20 mb-3"
            strokeWidth={1.25}
          />
          <p className="text-[#1a1c1c]/50 text-sm font-medium">
            No offers received yet
          </p>
          <p className="text-[#1a1c1c]/30 text-xs mt-1">
            Offers on your active listings will appear here
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#faf9f8] rounded-2xl">
          <p className="text-[#1a1c1c]/40 text-sm">
            No {filterTab !== "all" ? filterTab : ""} offers
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onUpdated={loadOffers} />
          ))}
        </div>
      ) : (
        <OfferCompareTable
          offers={
            filtered.filter((o) => o.status === "pending").length >= 2
              ? filtered.filter((o) => o.status === "pending")
              : filtered
          }
        />
      )}
    </div>
  );
}
