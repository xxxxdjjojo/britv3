"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "./WizardShell";
import type { SellerListing, ListingType, PriceQualifier } from "@/types/seller";
import { cn } from "@/lib/utils";

const LISTING_TYPES: Array<{ key: ListingType; label: string; desc: string }> = [
  { key: "for_sale", label: "For Sale", desc: "Standard fixed or guide price" },
  { key: "auction", label: "Auction", desc: "Sold at auction, guide price shown" },
  { key: "expressions_of_interest", label: "Expressions of Interest", desc: "Informal offers invited" },
];

const PRICE_QUALIFIERS: Array<{ key: NonNullable<PriceQualifier>; label: string }> = [
  { key: "offers_over", label: "Offers Over" },
  { key: "offers_in_excess_of", label: "Offers in Excess Of" },
  { key: "guide_price", label: "Guide Price" },
  { key: "fixed_price", label: "Fixed Price" },
  { key: "poa", label: "Price on Application (POA)" },
];

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
  listingId: string;
}>;

export function Step5Price({ listing, listingId }: Props) {
  const router = useRouter();
  const [priceStr, setPriceStr] = useState(
    listing?.asking_price ? String(listing.asking_price / 100) : "",
  );
  const [listingType, setListingType] = useState<ListingType>(listing?.listing_type ?? "for_sale");
  const [qualifier, setQualifier] = useState<PriceQualifier>(listing?.price_qualifier ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const priceNum = parseInt(priceStr.replace(/,/g, "")) || 0;
  const isValid = !!(priceStr.trim() && priceNum >= 1000);

  const handleContinue = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asking_price: priceNum * 100,
          listing_type: listingType,
          price_qualifier: qualifier,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/dashboard/seller/listings/create?step=6&id=${listingId}`);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardShell step={5} listingId={listingId} onContinue={handleContinue} continueDisabled={!isValid} isLoading={saving}>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Price & Listing Type</h2>
          <p className="text-slate-500 text-sm mt-1">Set your asking price and how you want to sell</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">Asking Price</label>
          <div className="mt-2 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">£</span>
            <input
              type="text"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="350000"
              className="w-full pl-9 pr-4 py-4 rounded-xl border border-slate-200 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30 focus:border-[#1B4D3E]"
            />
          </div>
          {priceNum > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              £{priceNum.toLocaleString("en-GB")}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Listing Type</label>
          <div className="space-y-2">
            {LISTING_TYPES.map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setListingType(key)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
                  listingType === key
                    ? "border-[#1B4D3E] bg-[#1B4D3E]/5"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0",
                  listingType === key ? "border-[#1B4D3E] bg-[#1B4D3E]" : "border-slate-300",
                )} />
                <div>
                  <p className={cn("text-sm font-bold", listingType === key ? "text-[#1B4D3E]" : "text-slate-900")}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            Price Qualifier <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            value={qualifier ?? ""}
            onChange={(e) => setQualifier((e.target.value || null) as PriceQualifier)}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30 bg-white"
          >
            <option value="">None</option>
            {PRICE_QUALIFIERS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </WizardShell>
  );
}
