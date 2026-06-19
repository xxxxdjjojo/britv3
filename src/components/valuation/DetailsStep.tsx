"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics/track-event";
import type { UserPropertyDetails, HouseSubtype, UserTenure, Condition } from "@/types/valuation";

const SUBTYPES: ReadonlyArray<{ value: HouseSubtype; label: string }> = [
  { value: "detached", label: "Detached house" },
  { value: "semi_detached", label: "Semi-detached house" },
  { value: "terraced", label: "Terraced house" },
  { value: "end_terrace", label: "End-of-terrace house" },
  { value: "bungalow", label: "Bungalow" },
  { value: "flat", label: "Flat / maisonette" },
  { value: "other", label: "Other" },
];
const TENURES: ReadonlyArray<{ value: UserTenure; label: string }> = [
  { value: "freehold", label: "Freehold" },
  { value: "leasehold", label: "Leasehold" },
  { value: "share_of_freehold", label: "Share of freehold" },
  { value: "unknown", label: "Not sure" },
];
const CONDITIONS: ReadonlyArray<{ value: Condition; label: string }> = [
  { value: "needs_major_work", label: "Needs major work" },
  { value: "below_average", label: "Below average" },
  { value: "average", label: "Average" },
  { value: "good", label: "Good" },
  { value: "recently_renovated", label: "Recently renovated" },
];

const selectClass =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

export function DetailsStep({ initial }: { initial: UserPropertyDetails | null }) {
  const router = useRouter();
  const [subtype, setSubtype] = useState<HouseSubtype>(initial?.subtype ?? "terraced");
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms?.toString() ?? "");
  const [floorArea, setFloorArea] = useState(initial?.floorAreaSqm?.toString() ?? "");
  const [tenure, setTenure] = useState<UserTenure>(initial?.tenure ?? "freehold");
  const [newBuild, setNewBuild] = useState(initial?.newBuild ?? false);
  const [condition, setCondition] = useState<Condition>(initial?.condition ?? "average");
  const [hasExtensionOrLoft, setExtension] = useState(initial?.hasExtensionOrLoft ?? false);
  const [parking, setParking] = useState(initial?.parking ?? false);
  const [garden, setGarden] = useState(initial?.garden ?? false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload: UserPropertyDetails = {
      subtype,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      floorAreaSqm: floorArea ? Number(floorArea) : null,
      tenure,
      newBuild,
      condition,
      hasExtensionOrLoft,
      parking,
      garden,
    };
    try {
      const res = await fetch("/api/valuations/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Please check the details and try again.");
        return;
      }
      trackEvent("details_completed", { subtype, has_floor_area: Boolean(floorArea) });
      router.push("/value-my-property/review");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="subtype">Property type</Label>
        <select id="subtype" className={selectClass} value={subtype} onChange={(e) => setSubtype(e.target.value as HouseSubtype)}>
          {SUBTYPES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" type="number" min={0} max={20} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="e.g. 3" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" type="number" min={0} max={20} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="e.g. 1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="floorArea">Approximate floor area (m², optional)</Label>
        <Input id="floorArea" type="number" min={5} max={2000} value={floorArea} onChange={(e) => setFloorArea(e.target.value)} placeholder="Leave blank if unknown" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenure">Tenure</Label>
          <select id="tenure" className={selectClass} value={tenure} onChange={(e) => setTenure(e.target.value as UserTenure)}>
            {TENURES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">General condition</Label>
          <select id="condition" className={selectClass} value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-neutral-700">Features</legend>
        {[
          { label: "New build", checked: newBuild, set: setNewBuild },
          { label: "Major extension or loft conversion", checked: hasExtensionOrLoft, set: setExtension },
          { label: "Parking or garage", checked: parking, set: setParking },
          { label: "Garden or outdoor space", checked: garden, set: setGarden },
        ].map((f) => (
          <label key={f.label} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="size-4 accent-brand-primary" checked={f.checked} onChange={(e) => f.set(e.target.checked)} />
            {f.label}
          </label>
        ))}
      </fieldset>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/value-my-property/address")}>
          Back
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </form>
  );
}
