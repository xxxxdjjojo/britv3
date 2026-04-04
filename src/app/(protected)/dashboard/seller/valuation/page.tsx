"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ValuationResult } from "@/components/seller/valuation/ValuationResult";
import type { LandRegistryComparable } from "@/types/seller";

type ValuationData = Readonly<{
  postcode: string;
  comparables: LandRegistryComparable[];
  ai_estimate: number;
  estimate_low: number;
  estimate_high: number;
  confidence: number;
  based_on: number;
}>;

export default function InstantValuationPage() {
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
        <h1 className="text-2xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">Instant Valuation</h1>
        <p className="text-neutral-500 mt-1">
          Get an instant estimate based on real Land Registry sold prices in your area
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <label className="text-sm font-semibold text-neutral-600 block mb-3">Property Postcode</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") void handleGetValuation(); }}
            placeholder="e.g. SW1A 1AA"
            className="flex-1 px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
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
            {loading ? "Loading..." : "Get Valuation"}
          </button>
        </div>
        {error && <p className="text-error text-sm mt-3">{error}</p>}
      </div>

      {result && (
        <ValuationResult
          postcode={result.postcode}
          aiEstimate={result.ai_estimate}
          estimateLow={result.estimate_low}
          estimateHigh={result.estimate_high}
          confidence={result.confidence}
          basedOn={result.based_on}
          comparables={result.comparables}
        />
      )}

      <p className="text-xs text-neutral-400 text-center">
        Estimates are based on Land Registry Price Paid Data and are for informational purposes only. They do not constitute a professional valuation.
      </p>
    </div>
  );
}
