"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "./WizardShell";
import type { SellerListing, EpcBand, CouncilTaxBand } from "@/types/seller";
import type { PlanningPermissionStatus } from "@/types/property";
import { cn } from "@/lib/utils";

const EPC_BANDS: EpcBand[] = ["A", "B", "C", "D", "E", "F", "G"];
const COUNCIL_TAX_BANDS: CouncilTaxBand[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

const PLANNING_PERMISSION_OPTIONS: ReadonlyArray<{
  value: PlanningPermissionStatus;
  label: string;
}> = [
  { value: "granted", label: "Granted" },
  { value: "pending", label: "Decision pending" },
  { value: "refused", label: "Refused" },
  { value: "none_known", label: "None known" },
];

const FEATURES = [
  "Garden", "Parking", "Garage", "Conservatory", "En-suite",
  "Study", "Utility Room", "Loft", "New Build", "Wheelchair Accessible",
];

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
  listingId?: string;
}>;

export function Step2Details({ listing, listingId }: Props) {
  const router = useRouter();
  const [bedrooms, setBedrooms] = useState<string>(
    listing?.bedrooms != null ? String(listing.bedrooms) : "",
  );
  const [bathrooms, setBathrooms] = useState<string>(
    listing?.bathrooms != null ? String(listing.bathrooms) : "",
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(listing?.features ?? []);
  const [epcBand, setEpcBand] = useState<EpcBand | null>(listing?.epc_band ?? null);
  const [councilTaxBand, setCouncilTaxBand] = useState<CouncilTaxBand | null>(listing?.council_tax_band ?? null);
  const [planningStatus, setPlanningStatus] = useState<PlanningPermissionStatus | null>(
    (listing as (Partial<SellerListing> & {
      planning_permission_status?: PlanningPermissionStatus | null;
    }) | null)?.planning_permission_status ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleFeature = (f: string) =>
    setSelectedFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const isValid = !!(bedrooms && bathrooms && parseInt(bedrooms) >= 0 && parseInt(bathrooms) >= 0 && planningStatus);

  const handleContinue = async () => {
    if (!isValid || !listingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          features: selectedFeatures,
          epc_band: epcBand,
          council_tax_band: councilTaxBand,
          planning_permission_status: planningStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/dashboard/seller/listings/create?step=3&id=${listingId}`);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardShell
      step={2}
      listingId={listingId}
      onContinue={() => void handleContinue()}
      continueDisabled={!isValid}
      isLoading={saving}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Property Details</h2>
          <p className="text-slate-500 text-sm mt-1">Tell buyers about the key details of your property</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">Bedrooms</label>
            <input
              type="number"
              min={0}
              max={20}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Bathrooms</label>
            <input
              type="number"
              min={0}
              max={10}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-3 block">Features</label>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                  selectedFeatures.includes(f)
                    ? "border-[#1B4D3E] bg-[#1B4D3E] text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            EPC Band <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            {EPC_BANDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setEpcBand(epcBand === b ? null : b)}
                className={cn(
                  "w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all",
                  epcBand === b
                    ? "border-[#1B4D3E] bg-[#1B4D3E] text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            Council Tax Band <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            {COUNCIL_TAX_BANDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setCouncilTaxBand(councilTaxBand === b ? null : b)}
                className={cn(
                  "w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all",
                  councilTaxBand === b
                    ? "border-[#1B4D3E] bg-[#1B4D3E] text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            Planning Permission Status <span className="text-red-500 font-normal">(required)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PLANNING_PERMISSION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlanningStatus(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                  planningStatus === opt.value
                    ? "border-[#1B4D3E] bg-[#1B4D3E] text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Required under NTSELAT material information rules.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </WizardShell>
  );
}
