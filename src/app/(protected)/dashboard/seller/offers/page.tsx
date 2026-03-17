"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutList, Columns } from "lucide-react";
import { OfferCard } from "@/components/seller/offers/OfferCard";
import { OfferCompareTable } from "@/components/seller/offers/OfferCompareTable";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "compare";

export default function OffersReceivedPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/offers");
      if (!res.ok) throw new Error("Failed to load");
      setOffers(await res.json());
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const activeOffers = offers.filter((o) => o.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Offers Received</h1>
          <p className="text-slate-500 mt-1">{activeOffers.length} active offer{activeOffers.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(["list", "compare"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {mode === "list" ? <LayoutList size={16} /> : <Columns size={16} />}
              {mode === "list" ? "List View" : "Compare"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-40" />)}</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 text-sm">No offers received yet</p>
          <p className="text-slate-300 text-xs mt-1">Offers on your active listings will appear here</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">{offers.map((offer) => <OfferCard key={offer.id} offer={offer} onUpdated={loadOffers} />)}</div>
      ) : (
        <OfferCompareTable offers={activeOffers.length >= 2 ? activeOffers : offers} />
      )}
    </div>
  );
}
