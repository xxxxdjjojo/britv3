"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { cn } from "@/lib/utils";
import { X, MapPin, Loader2 } from "lucide-react";

const MARKET_TYPES = [
  "Residential", "Commercial", "Lettings", "Student", "Luxury", "New Build",
];
const MAX_DISTRICTS = 20;

type ServiceArea = {
  district: string;
  area: string;
  latitude: number;
  longitude: number;
};

export function ServiceAreasStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: () => void;
    onBack: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketTypes, setMarketTypes] = useState<string[]>(["Residential"]);

  function toggleMarket(market: string) {
    setMarketTypes((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market],
    );
  }

  async function addDistrict() {
    const value = inputValue.trim().toUpperCase();
    if (!value) return;
    if (areas.length >= MAX_DISTRICTS) {
      setError(`Maximum ${MAX_DISTRICTS} service areas.`);
      return;
    }
    if (areas.find((a) => a.district === value)) {
      setError("Already added.");
      return;
    }

    setLooking(true);
    setError(null);

    try {
      const res = await fetch("/api/lookup/postcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid postcode district");
        return;
      }

      const data = await res.json();
      setAreas([...areas, {
        district: data.district,
        area: data.area,
        latitude: data.latitude,
        longitude: data.longitude,
      }]);
      setInputValue("");
    } catch {
      setError("Lookup failed. Please try again.");
    } finally {
      setLooking(false);
    }
  }

  function removeArea(district: string) {
    setAreas(areas.filter((a) => a.district !== district));
  }

  async function handleSubmit() {
    if (areas.length === 0) return;

    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete existing and replace
      await supabase.from("service_areas").delete().eq("user_id", user.id);

      const rows = areas.map((a) => ({
        user_id: user.id,
        postcode_district: a.district,
        display_name: a.area,
        latitude: a.latitude,
        longitude: a.longitude,
        market_types: marketTypes,
      }));

      const { error: insertError } = await supabase.from("service_areas").insert(rows);
      if (insertError) throw new Error(insertError.message);

      return areas;
    });

    if (result) props.onSubmit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Service Areas
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Add the UK postcode districts where you operate (e.g. SW1, M14, B1). Up to {MAX_DISTRICTS}.
        </p>
      </div>

      {/* Postcode input */}
      <div className="space-y-2">
        <Label>Postcode District</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. SW1, M14, EC1"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDistrict())}
            className="h-11 font-mono uppercase"
          />
          <Button
            type="button"
            onClick={addDistrict}
            disabled={looking || !inputValue.trim()}
            variant="outline"
          >
            {looking ? <Loader2 className="size-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Tags */}
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <span
              key={area.district}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-primary"
            >
              <MapPin className="size-3" />
              {area.district} — {area.area}
              <button
                type="button"
                onClick={() => removeArea(area.district)}
                className="ml-1 rounded-full hover:bg-brand-primary/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Market types */}
      <div className="space-y-2">
        <Label>Market Types</Label>
        <div className="flex flex-wrap gap-1.5">
          {MARKET_TYPES.map((market) => (
            <button
              key={market}
              type="button"
              onClick={() => toggleMarket(market)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                marketTypes.includes(market)
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-brand-primary",
              )}
            >
              {market}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || areas.length === 0}
          className="flex-1"
        >
          {saving ? "Saving..." : "Save and Continue"}
        </Button>
      </div>
    </div>
  );
}
