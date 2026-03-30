"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  X,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Bell,
  Mail,
  Home,
  Building2,
  Users,
  PawPrint,
  Car,
  TreeDeciduous,
  Armchair,
  Zap,
} from "lucide-react";

const STEPS = ["Location", "Budget", "Preferences", "Alerts"];

type PropertyType = "Studio" | "Flat" | "House" | "House Share";
type MustHave = "Furnished" | "Pet-friendly" | "Bills included" | "Parking" | "Garden";
type AlertChannel = "email" | "push";
type AlertFrequency = "Instant" | "Daily" | "Weekly" | "Off";

interface AlertPref {
  label: string;
  email: AlertFrequency;
  push: AlertFrequency;
}

const PROPERTY_TYPES: { value: PropertyType; icon: React.ReactNode }[] = [
  { value: "Studio", icon: <Home className="size-5" aria-hidden="true" /> },
  { value: "Flat", icon: <Building2 className="size-5" aria-hidden="true" /> },
  { value: "House", icon: <Home className="size-5" aria-hidden="true" /> },
  { value: "House Share", icon: <Users className="size-5" aria-hidden="true" /> },
];

const MUST_HAVE_OPTIONS: { value: MustHave; icon: React.ReactNode }[] = [
  { value: "Furnished", icon: <Armchair className="size-4" aria-hidden="true" /> },
  { value: "Pet-friendly", icon: <PawPrint className="size-4" aria-hidden="true" /> },
  { value: "Bills included", icon: <Zap className="size-4" aria-hidden="true" /> },
  { value: "Parking", icon: <Car className="size-4" aria-hidden="true" /> },
  { value: "Garden", icon: <TreeDeciduous className="size-4" aria-hidden="true" /> },
];

const ALERT_CATEGORIES = [
  "New matching properties",
  "Price reductions",
  "Updates on viewed",
  "Market reports",
];

const FREQUENCY_OPTIONS: AlertFrequency[] = ["Instant", "Daily", "Weekly", "Off"];

const BED_OPTIONS = [0, 1, 2, 3, 4, 5];

function formatRent(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

export function RenterOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("renter_onboarding_step");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [saving, setSaving] = useState(false);

  const updateStep = useCallback((newStep: number) => {
    setStep(newStep);
    localStorage.setItem("renter_onboarding_step", String(newStep));
  }, []);

  // Step 0 — Location
  const [locationInput, setLocationInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);

  // Step 1 — Monthly rent budget
  const [minRent, setMinRent] = useState(500);
  const [maxRent, setMaxRent] = useState(2000);

  // Step 2 — Preferences
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [minBeds, setMinBeds] = useState(1);
  const [mustHaves, setMustHaves] = useState<MustHave[]>([]);

  // Step 3 — Alerts
  const [alertPrefs, setAlertPrefs] = useState<AlertPref[]>(
    ALERT_CATEGORIES.map((label) => ({ label, email: "Daily", push: "Instant" })),
  );

  function addLocation() {
    const val = sanitize(locationInput.trim());
    if (val && locations.length < 5 && !locations.includes(val)) {
      setLocations([...locations, val]);
      setLocationInput("");
    }
  }

  function removeLocation(loc: string) {
    setLocations(locations.filter((l) => l !== loc));
  }

  function togglePropertyType(type: PropertyType) {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function toggleMustHave(item: MustHave) {
    setMustHaves((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }

  function setAlertFreq(index: number, channel: AlertChannel, freq: AlertFrequency) {
    setAlertPrefs((prev) =>
      prev.map((pref, i) => (i === index ? { ...pref, [channel]: freq } : pref)),
    );
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Derive the primary notification_frequency from the most common email
        // frequency across all alert categories (used as the scalar DB column).
        // TODO: When a `notification_preferences` JSONB column is added to
        // `renter_preferences`, persist the full `alertPrefs` matrix here instead.
        const freqCounts = alertPrefs.reduce<Record<string, number>>(
          (acc, p) => {
            const key = p.email.toLowerCase();
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          },
          {},
        );
        const primaryFreq =
          Object.entries(freqCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
          "daily";

        await supabase.from("renter_preferences").upsert(
          {
            user_id: user.id,
            preferred_locations: locations,
            min_monthly_rent: minRent,
            max_monthly_rent: maxRent,
            property_types: propertyTypes,
            min_bedrooms: minBeds,
            requirements: mustHaves,
            notification_frequency: primaryFreq,
          },
          { onConflict: "user_id" },
        );
      }
    } catch {
      // Non-blocking — continue to dashboard even if save fails
    } finally {
      setSaving(false);
    }
    localStorage.removeItem("renter_onboarding_step");
    props.onComplete();
  }

  const SkipLink = () => (
    <button
      type="button"
      onClick={props.onSkip}
      aria-label="Skip onboarding for now"
      className="w-full py-2 text-center font-sans text-sm text-neutral-400 transition-colors hover:text-neutral-600"
    >
      Skip for now
    </button>
  );

  const NavButtons = ({
    onBack,
    onContinue,
    continueLabel = "Continue",
    continueDisabled = false,
    isLast = false,
  }: {
    onBack?: () => void;
    onContinue: () => void;
    continueLabel?: string;
    continueDisabled?: boolean;
    isLast?: boolean;
  }) => (
    <div className="flex items-center gap-3 pt-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back to previous step"
          className="flex items-center gap-1.5 font-sans text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>
      )}
      <Button
        onClick={onContinue}
        disabled={continueDisabled || (isLast && saving)}
        aria-label={isLast ? "Complete setup" : "Continue to next step"}
        className="ml-auto flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-light disabled:opacity-50"
      >
        {isLast && saving ? "Saving…" : continueLabel}
        {!isLast && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
    </div>
  );

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={step}
      title={
        step === 0
          ? "Where are you looking to rent?"
          : step === 1
            ? "What\u2019s your monthly budget?"
            : step === 2
              ? "What matters most to you?"
              : "Stay in the loop"
      }
      subtitle={
        step === 0
          ? "Add up to 5 locations — cities, towns, postcodes or neighbourhoods."
          : step === 1
            ? "Set your monthly rent range. You can update this anytime."
            : step === 2
              ? "Tell us your preferences so we can find your ideal rental."
              : "Choose how and when you want to hear from us."
      }
    >
      {/* ── Step 0: Location ── */}
      {step === 0 && (
        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <Input
                placeholder="City, town, postcode or neighbourhood"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLocation();
                  }
                }}
                aria-label="Search location"
                className="h-12 rounded-xl border-neutral-200 pl-9 font-sans text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addLocation}
              disabled={locations.length >= 5 || !locationInput.trim()}
              aria-label="Add location"
              className="h-12 rounded-xl border-neutral-200 px-5 font-sans text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            >
              Add
            </Button>
          </div>

          {/* Location chips */}
          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2" role="list" aria-label="Selected locations">
              {locations.map((loc) => (
                <span
                  key={loc}
                  role="listitem"
                  className="flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary-lighter px-3 py-1.5 font-sans text-sm font-medium text-brand-primary"
                >
                  <MapPin className="size-3" aria-hidden="true" />
                  {loc}
                  <button
                    type="button"
                    onClick={() => removeLocation(loc)}
                    aria-label={`Remove ${loc}`}
                    className="ml-0.5 rounded-full text-brand-primary/60 transition-colors hover:text-brand-primary"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="font-sans text-xs text-neutral-400">
            {locations.length}/5 locations added
          </p>

          <NavButtons
            onContinue={() => updateStep(1)}
            continueDisabled={locations.length === 0}
          />
          <SkipLink />
        </div>
      )}

      {/* ── Step 1: Monthly rent budget ── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Budget display */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Minimum / month
                </p>
                <p className="font-heading text-2xl font-bold text-neutral-900">
                  {formatRent(minRent)}
                </p>
              </div>
              <div className="h-8 w-px bg-neutral-200" aria-hidden="true" />
              <div className="space-y-0.5 text-right">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Maximum / month
                </p>
                <p className="font-heading text-2xl font-bold text-neutral-900">
                  {formatRent(maxRent)}
                </p>
              </div>
            </div>
          </div>

          {/* Min rent slider */}
          <div className="space-y-2">
            <label htmlFor="min-rent" className="font-sans text-sm font-medium text-neutral-700">
              Minimum rent / month
            </label>
            <input
              id="min-rent"
              type="range"
              min={200}
              max={5000}
              step={50}
              value={minRent}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinRent(Math.min(val, maxRent - 50));
              }}
              aria-label="Minimum monthly rent"
              aria-valuetext={formatRent(minRent)}
              className="w-full cursor-pointer accent-brand-primary"
            />
            <div className="flex justify-between font-sans text-xs text-neutral-400">
              <span>£200</span>
              <span>£5,000</span>
            </div>
          </div>

          {/* Max rent slider */}
          <div className="space-y-2">
            <label htmlFor="max-rent" className="font-sans text-sm font-medium text-neutral-700">
              Maximum rent / month
            </label>
            <input
              id="max-rent"
              type="range"
              min={200}
              max={5000}
              step={50}
              value={maxRent}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxRent(Math.max(val, minRent + 50));
              }}
              aria-label="Maximum monthly rent"
              aria-valuetext={formatRent(maxRent)}
              className="w-full cursor-pointer accent-brand-primary"
            />
            <div className="flex justify-between font-sans text-xs text-neutral-400">
              <span>£200</span>
              <span>£5,000</span>
            </div>
          </div>

          <NavButtons onBack={() => updateStep(0)} onContinue={() => updateStep(2)} />
          <SkipLink />
        </div>
      )}

      {/* ── Step 2: Preferences ── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Property type cards */}
          <div className="space-y-2">
            <p className="font-sans text-sm font-semibold text-neutral-700">Property type</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROPERTY_TYPES.map(({ value, icon }) => {
                const selected = propertyTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => togglePropertyType(value)}
                    aria-pressed={selected}
                    aria-label={`${value} property type`}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-4 font-sans text-sm font-medium transition-all duration-150",
                      selected
                        ? "border-brand-primary bg-brand-primary-lighter text-brand-primary shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                    )}
                  >
                    {icon}
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <p className="font-sans text-sm font-semibold text-neutral-700">Minimum bedrooms</p>
            <div className="flex flex-wrap gap-2">
              {BED_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinBeds(n)}
                  aria-pressed={minBeds === n}
                  aria-label={`${n === 0 ? "Studio" : `${n} bedroom${n > 1 ? "s" : ""}`} minimum`}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border-2 font-sans text-sm font-semibold transition-all duration-150",
                    minBeds === n
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                  )}
                >
                  {n === 0 ? "S" : n}
                </button>
              ))}
            </div>
            <p className="font-sans text-xs text-neutral-400">S = Studio</p>
          </div>

          {/* Must-haves */}
          <div className="space-y-2">
            <p className="font-sans text-sm font-semibold text-neutral-700">Must-haves</p>
            <div className="flex flex-wrap gap-2">
              {MUST_HAVE_OPTIONS.map(({ value, icon }) => {
                const selected = mustHaves.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleMustHave(value)}
                    aria-pressed={selected}
                    aria-label={`Toggle ${value} as must-have`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border-2 px-4 py-2.5 font-sans text-sm font-medium transition-all duration-150",
                      selected
                        ? "border-brand-primary bg-brand-primary-lighter text-brand-primary"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                    )}
                  >
                    {icon}
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <NavButtons onBack={() => updateStep(1)} onContinue={() => updateStep(3)} />
          <SkipLink />
        </div>
      )}

      {/* ── Step 3: Alerts ── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Channel header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-neutral-100 pb-2">
            <span className="font-sans text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Alert type
            </span>
            <span className="flex w-28 items-center justify-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-400">
              <Mail className="size-3.5" aria-hidden="true" />
              Email
            </span>
            <span className="flex w-28 items-center justify-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-400">
              <Bell className="size-3.5" aria-hidden="true" />
              Push
            </span>
          </div>

          {/* Alert rows */}
          <div className="space-y-3">
            {alertPrefs.map((pref, index) => (
              <div
                key={pref.label}
                className="grid grid-cols-[1fr_auto_auto] items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3"
              >
                <p className="pt-1 font-sans text-sm font-medium text-neutral-800">
                  {pref.label}
                </p>
                {/* Email frequency selector */}
                <div className="flex w-28 flex-col gap-1">
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setAlertFreq(index, "email", freq)}
                      aria-pressed={pref.email === freq}
                      aria-label={`Set ${pref.label} email alerts to ${freq}`}
                      className={cn(
                        "rounded-lg px-2 py-1 font-sans text-xs font-medium transition-all",
                        pref.email === freq
                          ? "bg-brand-primary text-white"
                          : "text-neutral-500 hover:bg-neutral-200",
                      )}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
                {/* Push frequency selector */}
                <div className="flex w-28 flex-col gap-1">
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setAlertFreq(index, "push", freq)}
                      aria-pressed={pref.push === freq}
                      aria-label={`Set ${pref.label} push alerts to ${freq}`}
                      className={cn(
                        "rounded-lg px-2 py-1 font-sans text-xs font-medium transition-all",
                        pref.push === freq
                          ? "bg-brand-primary text-white"
                          : "text-neutral-500 hover:bg-neutral-200",
                      )}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <NavButtons
            onBack={() => updateStep(2)}
            onContinue={handleComplete}
            continueLabel="Complete Setup"
            isLast
          />
        </div>
      )}
    </OnboardingLayout>
  );
}
