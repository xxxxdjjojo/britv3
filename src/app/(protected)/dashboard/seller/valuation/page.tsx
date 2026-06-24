"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ValuationResult } from "@/components/seller/valuation/ValuationResult";
import type { LandRegistryComparable } from "@/types/seller";
import type { SoldPriceEvidence } from "@/lib/seller/sold-price-comparables";

type ValuationData = Readonly<{
  postcode: string;
  comparables: LandRegistryComparable[];
  estimate: number;
  range_low: number;
  range_high: number;
  evidence: SoldPriceEvidence;
  based_on: number;
}>;

export default function NearbySoldPricesPage() {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationData | null>(null);
  const [error, setError] = useState("");

  const handleGetValuation = async () => {
    if (!postcode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/seller/valuation?postcode=${encodeURIComponent(postcode.trim().toUpperCase())}`);
      if (!res.ok) throw new Error("Failed to fetch valuation data");
      const data = await res.json() as ValuationData;
      setResult(data);
    } catch {
      setError("Could not retrieve valuation data. Please check the postcode and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Nearby Sold Prices</h1>
        <p className="text-slate-500 mt-1">
          See the average of recent Land Registry sold prices near a postcode
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <label className="text-sm font-semibold text-slate-700 block mb-3">Property Postcode</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") void handleGetValuation(); }}
            placeholder="e.g. SW1A 1AA"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
          <button
            type="button"
            onClick={() => void handleGetValuation()}
            disabled={loading || !postcode.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {loading ? "Loading..." : "Show Sold Prices"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {result && (
        <ValuationResult
          postcode={result.postcode}
          estimate={result.estimate}
          rangeLow={result.range_low}
          rangeHigh={result.range_high}
          evidence={result.evidence}
          basedOn={result.based_on}
          comparables={result.comparables}
        />
      )}

      <p className="text-xs text-slate-400 text-center">
        Estimates are based on Land Registry Price Paid Data and are for informational purposes only. They do not constitute a professional valuation.
      </p>
    </div>
  );
}
