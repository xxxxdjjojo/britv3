"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STEPS = ["Location", "Budget", "Property Type", "Alerts"];

const PROPERTY_TYPES = ["Flat", "House", "Bungalow", "New Build"];
const MUST_HAVES = ["Garden", "Parking", "EPC A-C", "No chain"];
const ALERT_FREQUENCIES = ["Instant", "Daily", "Weekly"] as const;
type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

export function BuyerOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Location
  const [locationInput, setLocationInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);

  // Step 2 — Budget
  const [minBudget, setMinBudget] = useState(100000);
  const [maxBudget, setMaxBudget] = useState(500000);

  // Step 3 — Property
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minBeds, setMinBeds] = useState(1);
  const [mustHaves, setMustHaves] = useState<string[]>([]);

  // Step 4 — Alerts
  const [alertFrequency, setAlertFrequency] = useState<AlertFrequency>("Daily");

  function addLocation() {
    const val = locationInput.trim();
    if (val && locations.length < 5 && !locations.includes(val)) {
      setLocations([...locations, val]);
      setLocationInput("");
    }
  }

  function toggleItem<T extends string>(items: T[], item: T, setter: (v: T[]) => void) {
    setter(items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("buyer_preferences").upsert(
          {
            user_id: user.id,
            preferred_locations: locations,
            min_budget: minBudget,
            max_budget: maxBudget,
            property_types: propertyTypes,
            min_bedrooms: minBeds,
            requirements: mustHaves,
            notification_frequency: alertFrequency.toLowerCase(),
          },
          { onConflict: "user_id" },
        );
      }
    } catch {
      // Non-blocking — continue to dashboard even if save fails
    } finally {
      setSaving(false);
    }
    props.onComplete();
  }

  const SkipLink = () => (
    <button
      type="button"
      onClick={props.onSkip}
      className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600"
    >
      Skip for now
    </button>
  );

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={step}
      title={
        step === 0 ? "Where are you looking?" :
        step === 1 ? "What's your budget?" :
        step === 2 ? "What type of property?" :
        "How often should we alert you?"
      }
      subtitle="This helps us personalise your search. You can update these anytime."
    >
      {/* Step 0: Location */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Manchester, M1"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLocation()}
              className="h-11"
            />
            <Button type="button" variant="outline" onClick={addLocation} disabled={locations.length >= 5}>
              Add
            </Button>
          </div>
          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <span
                  key={loc}
                  className="flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-sm text-brand-primary"
                >
                  {loc}
                  <button onClick={() => setLocations(locations.filter((l) => l !== loc))} className="text-brand-primary/60 hover:text-brand-primary">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-neutral-400">Add up to 5 areas</p>
          <div className="flex gap-3">
            <Button onClick={() => setStep(1)} className="flex-1" disabled={locations.length === 0}>
              Continue
            </Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* Step 1: Budget */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">£</span>
                <Input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(Number(e.target.value))}
                  className="h-11 pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Maximum</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">£</span>
                <Input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="h-11 pl-7"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(2)} className="flex-1">Continue</Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* Step 2: Property type */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleItem(propertyTypes, type, setPropertyTypes)}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                  propertyTypes.includes(type)
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
                )}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Label>Min bedrooms</Label>
            <div className="flex items-center gap-2">
              <button onClick={() => setMinBeds(Math.max(0, minBeds - 1))} className="flex size-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50">-</button>
              <span className="w-8 text-center font-medium">{minBeds}</span>
              <button onClick={() => setMinBeds(minBeds + 1)} className="flex size-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50">+</button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Must-haves</Label>
            <div className="flex flex-wrap gap-2">
              {MUST_HAVES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(mustHaves, item, setMustHaves)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    mustHaves.includes(item)
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* Step 3: Alerts */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {ALERT_FREQUENCIES.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setAlertFrequency(freq)}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                  alertFrequency === freq
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
                )}
              >
                {freq}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button onClick={handleComplete} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
