"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "./WizardShell";
import type { SellerListing, PropertyType, Tenure } from "@/types/seller";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const PROPERTY_TYPES: Array<{ key: PropertyType; label: string; icon: string }> = [
  { key: "detached", label: "Detached", icon: "🏡" },
  { key: "semi-detached", label: "Semi-Detached", icon: "🏘️" },
  { key: "terraced", label: "Terraced", icon: "🏠" },
  { key: "flat", label: "Flat / Maisonette", icon: "🏢" },
  { key: "bungalow", label: "Bungalow", icon: "🏚️" },
  { key: "other", label: "Other", icon: "🏗️" },
];

type AddressSuggestion = Readonly<{
  admin_district: string | null;
  region: string | null;
}>;

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
}>;

export function Step1AddressType({ listing }: Props) {
  const router = useRouter();
  const [postcode, setPostcode] = useState(listing?.postcode ?? "");
  const [selectedAddress, setSelectedAddress] = useState(listing?.address_line_1 ?? "");
  const [city, setCity] = useState(listing?.city ?? "");
  const [postcodeData, setPostcodeData] = useState<AddressSuggestion | null>(null);
  const [propertyType, setPropertyType] = useState<PropertyType | null>(listing?.property_type ?? null);
  const [tenure, setTenure] = useState<Tenure | null>(listing?.tenure ?? null);
  const [leaseholdYears, setLeaseholdYears] = useState<string>(
    String(listing?.leasehold_years_remaining ?? ""),
  );
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lookupPostcode = async () => {
    if (!postcode.trim()) return;
    setLookingUp(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`,
      );
      if (!res.ok) { setError("Postcode not found. Try again."); return; }
      const json = await res.json() as { result: AddressSuggestion };
      setPostcodeData(json.result);
      setCity(json.result.admin_district ?? json.result.region ?? "");
    } catch {
      setError("Could not look up postcode. Please check your internet connection.");
    } finally {
      setLookingUp(false);
    }
  };

  const isValid = !!(
    postcode.trim() &&
    selectedAddress.trim() &&
    city.trim() &&
    propertyType &&
    tenure &&
    (tenure === "freehold" || (tenure === "leasehold" && leaseholdYears && parseInt(leaseholdYears) > 0))
  );

  const handleContinue = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const body = {
        postcode: postcode.trim().toUpperCase(),
        address_line_1: selectedAddress.trim(),
        city: city.trim(),
        property_type: propertyType,
        tenure,
        leasehold_years_remaining: tenure === "leasehold" ? parseInt(leaseholdYears) : null,
      };
      const res = await fetch("/api/seller/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create listing");
      const data = await res.json() as { id: string };
      router.push(`/dashboard/seller/listings/create?step=2&id=${data.id}`);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardShell
      step={1}
      onContinue={() => void handleContinue()}
      continueDisabled={!isValid}
      isLoading={saving}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Property Address
          </h2>
          <p className="text-slate-500 text-sm mt-1">Start by entering your property&apos;s postcode</p>
        </div>

        {/* Postcode lookup */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Postcode</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") void lookupPostcode(); }}
              placeholder="e.g. SW1A 1AA"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30 focus:border-[#1B4D3E]"
            />
            <button
              type="button"
              onClick={() => void lookupPostcode()}
              disabled={lookingUp}
              className="px-5 py-3 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] transition-colors disabled:opacity-50"
            >
              {lookingUp ? "Looking up..." : "Find Address"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}

          {(postcodeData || listing?.address_line_1) && (
            <div className="mt-3 space-y-3 bg-slate-50 rounded-xl p-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Address Line 1</label>
                <input
                  type="text"
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  placeholder="e.g. 14 Elm Road"
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">City / Town</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London"
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Property type grid */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Property Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROPERTY_TYPES.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPropertyType(key)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all duration-150",
                  propertyType === key
                    ? "border-[#1B4D3E] bg-[#1B4D3E]/5 text-[#1B4D3E]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span className="text-2xl">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tenure */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            Tenure
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="inline-flex cursor-help">
                  <Info size={14} className="text-slate-400" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs"><strong>Freehold:</strong> You own the property and land outright, indefinitely.</p>
                  <p className="text-xs mt-1"><strong>Leasehold:</strong> You own the property for a fixed period under a lease from the freeholder. Common for flats.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="flex gap-3">
            {(["freehold", "leasehold"] as Tenure[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenure(t)}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all duration-150",
                  tenure === t
                    ? "border-[#1B4D3E] bg-[#1B4D3E]/5 text-[#1B4D3E]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tenure === "leasehold" && (
            <>
              <div className="bg-slate-100 rounded-xl p-4">
                <label className="text-xs font-semibold text-slate-600">Years Remaining on Lease</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={leaseholdYears}
                  onChange={(e) => setLeaseholdYears(e.target.value)}
                  placeholder="e.g. 125"
                  className="mt-2 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
                />
              </div>
              {leaseholdYears && parseInt(leaseholdYears) > 0 && parseInt(leaseholdYears) < 80 && (
                <div className="mt-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800">Short Lease Warning</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Leases under 80 years can be difficult to mortgage and significantly affect
                    property value. The cost of lease extension increases substantially below 80
                    years due to &quot;marriage value&quot; provisions. Consider extending the lease
                    before selling, or set pricing expectations accordingly.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </WizardShell>
  );
}
